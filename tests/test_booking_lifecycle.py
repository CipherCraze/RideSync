import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_double_booking_prevention(client: AsyncClient, auth_headers_user2):
    """Attempting to book a vehicle on overlapping dates must fail with 400."""
    now = datetime.now(timezone.utc)
    # Booking 2 already exists on [now + 2 days, now + 5 days]
    payload = {
        "vehicle_id": 1,
        "start_date": (now + timedelta(days=3)).isoformat(),
        "end_date": (now + timedelta(days=6)).isoformat(),
    }
    response = await client.post("/api/bookings/", json=payload, headers=auth_headers_user2)
    assert response.status_code == 400
    assert "already booked" in response.json()["detail"]

@pytest.mark.asyncio
async def test_booking_lifecycle_and_mock_payment(client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """
    Test end-to-end booking lifecycle:
    1. Create booking (PENDING)
    2. Host confirms booking (CONFIRMED)
    3. Renter makes mock payment (PAID)
    4. View transaction receipt
    5. Pickup / Start active rental (RENTAL_ACTIVE)
    6. Return vehicle (RETURNED)
    7. Host completes & finalizes rental (COMPLETED)
    """
    now = datetime.now(timezone.utc)
    start_dt = now + timedelta(days=15)
    end_dt = now + timedelta(days=18)

    # 1. Create booking
    create_res = await client.post(
        "/api/bookings/",
        json={
            "vehicle_id": 1,
            "start_date": start_dt.isoformat(),
            "end_date": end_dt.isoformat(),
        },
        headers=auth_headers_user2
    )
    assert create_res.status_code == 201
    booking = create_res.json()
    b_id = booking["id"]
    assert booking["status"] == "PENDING"
    assert booking["payment_status"] == "PENDING"

    # 2. Host confirms booking
    confirm_res = await client.put(
        f"/api/bookings/{b_id}/status",
        json={"status": "CONFIRMED"},
        headers=auth_headers_user1
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "CONFIRMED"

    # 3. Renter processes mock payment
    pay_res = await client.post(
        f"/api/bookings/{b_id}/pay?status=SUCCESS",
        headers=auth_headers_user2
    )
    assert pay_res.status_code == 200
    tx = pay_res.json()
    assert tx["status"] == "SUCCESS"
    assert tx["amount"] == booking["total_price"]

    # 4. View receipt
    receipt_res = await client.get(
        f"/api/bookings/{b_id}/receipt",
        headers=auth_headers_user2
    )
    assert receipt_res.status_code == 200
    receipts = receipt_res.json()
    assert len(receipts) >= 1
    assert receipts[0]["status"] == "SUCCESS"

    # 5. Pickup / Start active rental
    active_res = await client.put(
        f"/api/bookings/{b_id}/status",
        json={"status": "RENTAL_ACTIVE"},
        headers=auth_headers_user1
    )
    assert active_res.status_code == 200
    assert active_res.json()["status"] == "RENTAL_ACTIVE"

    # 6. Renter returns vehicle
    return_res = await client.put(
        f"/api/bookings/{b_id}/status",
        json={"status": "RETURNED"},
        headers=auth_headers_user2
    )
    assert return_res.status_code == 200
    assert return_res.json()["status"] == "RETURNED"

    # 7. Host completes rental
    complete_res = await client.put(
        f"/api/bookings/{b_id}/status",
        json={"status": "COMPLETED"},
        headers=auth_headers_user1
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "COMPLETED"

@pytest.mark.asyncio
async def test_radius_proposal_and_agreement(client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Renter proposes a permitted operational radius, Host accepts it."""
    # Booking 2 is pending
    propose_res = await client.post(
        "/api/bookings/2/propose-radius",
        json={"proposed_radius_km": 45.0},
        headers=auth_headers_user2
    )
    assert propose_res.status_code == 200
    b_data = propose_res.json()
    assert b_data["proposed_radius_km"] == 45.0
    assert b_data["radius_proposal_status"] == "PENDING"
    assert b_data["radius_proposal_by"] == "RENTER"

    # Host accepts the proposed radius
    accept_res = await client.post(
        "/api/bookings/2/respond-radius",
        json={"action": "ACCEPT"},
        headers=auth_headers_user1
    )
    assert accept_res.status_code == 200
    accepted_data = accept_res.json()
    assert accepted_data["permitted_radius_km"] == 45.0
    assert accepted_data["radius_proposal_status"] == "ACCEPTED"

@pytest.mark.asyncio
async def test_cancellation_and_mock_refund(client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Paid booking cancelled reflects REFUNDED payment status flag."""
    now = datetime.now(timezone.utc)
    # Create and pay a new booking
    res = await client.post(
        "/api/bookings/",
        json={
            "vehicle_id": 1,
            "start_date": (now + timedelta(days=25)).isoformat(),
            "end_date": (now + timedelta(days=27)).isoformat(),
        },
        headers=auth_headers_user2
    )
    b_id = res.json()["id"]

    await client.post(f"/api/bookings/{b_id}/pay?status=SUCCESS", headers=auth_headers_user2)

    # Cancel booking
    cancel_res = await client.put(
        f"/api/bookings/{b_id}/status",
        json={"status": "CANCELLED", "cancellation_reason": "Emergency schedule shift"},
        headers=auth_headers_user2
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
    assert cancel_res.json()["payment_status"] == "REFUNDED"
