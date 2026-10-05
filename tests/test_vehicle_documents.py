import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_vehicle_draft_and_submit_for_review(
    client: AsyncClient,
    auth_headers_user1,
    test_data,
):
    # 1. Create a vehicle in DRAFT status
    payload = {
        "brand": "Mazda",
        "model": "MX-5 Miata",
        "year": 2023,
        "vehicle_type": "Convertible",
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "seats": 2,
        "price_per_day": 75.0,
        "description": "Fun weekend convertible",
        "pickup_location": "San Francisco, CA",
        "status": "DRAFT",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1541899481282?w=800", "angle": "FRONT", "is_primary": True}
        ]
    }
    create_res = await client.post("/api/vehicles/", json=payload, headers=auth_headers_user1)
    assert create_res.status_code == 201, create_res.text
    veh = create_res.json()
    assert veh["status"] == "DRAFT"
    assert veh["is_approved"] is False
    veh_id = veh["id"]

    # 2. Submit vehicle for review
    submit_res = await client.put(f"/api/vehicles/{veh_id}/submit", headers=auth_headers_user1)
    assert submit_res.status_code == 200, submit_res.text
    submitted_veh = submit_res.json()
    assert submitted_veh["status"] == "PENDING"
    assert submitted_veh["is_approved"] is False

@pytest.mark.asyncio
async def test_vehicle_document_validation(
    client: AsyncClient,
    auth_headers_user1,
    auth_headers_user3,
    test_data,
):
    # Create vehicle for User 1
    create_res = await client.post(
        "/api/vehicles/",
        json={
            "brand": "Subaru",
            "model": "WRX",
            "year": 2022,
            "vehicle_type": "Sedan",
            "fuel_type": "Petrol",
            "transmission": "Manual",
            "seats": 5,
            "price_per_day": 80.0,
            "description": "AWD turbo sedan",
            "pickup_location": "Denver, CO",
            "status": "DRAFT"
        },
        headers=auth_headers_user1,
    )
    assert create_res.status_code == 201
    veh_id = create_res.json()["id"]

    now = datetime.now(timezone.utc)

    # 1. Attach valid RC document
    rc_res = await client.post(
        f"/api/vehicles/{veh_id}/documents",
        json={
            "document_type": "RC",
            "document_url": "http://localhost:8000/uploads/documents/sample_rc.pdf",
            "document_number": "CO-WRX-2022"
        },
        headers=auth_headers_user1
    )
    assert rc_res.status_code == 201
    rc_data = rc_res.json()
    assert rc_data["document_type"] == "RC"
    assert rc_data["status"] == "PENDING"

    # 2. Fail expired PUC certificate
    expired_puc = now - timedelta(days=10)
    fail_puc_res = await client.post(
        f"/api/vehicles/{veh_id}/documents",
        json={
            "document_type": "PUC",
            "document_url": "http://localhost:8000/uploads/documents/sample_puc.pdf",
            "expiry_date": expired_puc.isoformat()
        },
        headers=auth_headers_user1
    )
    assert fail_puc_res.status_code == 400
    assert "expired" in fail_puc_res.json()["detail"].lower()

    # 3. Attach valid future PUC certificate
    valid_puc = now + timedelta(days=180)
    puc_res = await client.post(
        f"/api/vehicles/{veh_id}/documents",
        json={
            "document_type": "PUC",
            "document_url": "http://localhost:8000/uploads/documents/sample_puc.pdf",
            "expiry_date": valid_puc.isoformat()
        },
        headers=auth_headers_user1
    )
    assert puc_res.status_code == 201
    assert puc_res.json()["status"] == "PENDING"

    # 4. Outsider cannot upload documents to another user's vehicle
    outsider_res = await client.post(
        f"/api/vehicles/{veh_id}/documents",
        json={
            "document_type": "RC",
            "document_url": "http://localhost:8000/uploads/documents/sample_rc.pdf"
        },
        headers=auth_headers_user3
    )
    assert outsider_res.status_code == 403

    # 5. List documents for the vehicle
    docs_res = await client.get(f"/api/vehicles/{veh_id}/documents")
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) >= 2
    types = [d["document_type"] for d in docs]
    assert "RC" in types
    assert "PUC" in types

@pytest.mark.asyncio
async def test_admin_approval_and_rejection_workflow(
    client: AsyncClient,
    auth_headers_user1,
    auth_headers_admin,
    test_data,
):
    # Create vehicle in PENDING status
    create_res = await client.post(
        "/api/vehicles/",
        json={
            "brand": "Polestar",
            "model": "2 Dual Motor",
            "year": 2024,
            "vehicle_type": "Electric",
            "fuel_type": "Electric",
            "transmission": "Automatic",
            "seats": 5,
            "price_per_day": 95.0,
            "description": "Clean luxury electric sedan",
            "pickup_location": "Seattle, WA",
            "status": "PENDING"
        },
        headers=auth_headers_user1,
    )
    assert create_res.status_code == 201
    veh_id = create_res.json()["id"]

    # 1. Admin rejects vehicle with reason
    reject_res = await client.put(
        f"/api/admin/vehicles/{veh_id}/reject",
        json={"reason": "Please provide clearer interior photos."},
        headers=auth_headers_admin
    )
    assert reject_res.status_code == 200
    rej_veh = reject_res.json()
    assert rej_veh["status"] == "REJECTED"
    assert rej_veh["is_approved"] is False
    assert "clearer interior photos" in rej_veh["rejection_reason"]

    # 2. Owner resubmits
    resubmit_res = await client.put(f"/api/vehicles/{veh_id}/submit", headers=auth_headers_user1)
    assert resubmit_res.status_code == 200
    assert resubmit_res.json()["status"] == "PENDING"

    # 3. Admin approves vehicle
    approve_res = await client.put(
        f"/api/admin/vehicles/{veh_id}/approve",
        headers=auth_headers_admin
    )
    assert approve_res.status_code == 200
    app_veh = approve_res.json()
    assert app_veh["status"] == "APPROVED"
    assert app_veh["is_approved"] is True

@pytest.mark.asyncio
async def test_admin_document_verification_queue(
    client: AsyncClient,
    auth_headers_user1,
    auth_headers_admin,
    test_data,
):
    # Create vehicle and document
    create_res = await client.post(
        "/api/vehicles/",
        json={
            "brand": "Genesis",
            "model": "G70 Sport",
            "year": 2023,
            "vehicle_type": "Sedan",
            "fuel_type": "Petrol",
            "transmission": "Automatic",
            "seats": 5,
            "price_per_day": 88.0,
            "description": "Sport sedan",
            "pickup_location": "Austin, TX",
            "status": "PENDING"
        },
        headers=auth_headers_user1
    )
    veh_id = create_res.json()["id"]

    doc_res = await client.post(
        f"/api/vehicles/{veh_id}/documents",
        json={
            "document_type": "SERVICE_RECORD",
            "document_url": "http://localhost:8000/uploads/documents/sample_service_record.pdf",
            "document_number": "SRV-GEN-101"
        },
        headers=auth_headers_user1
    )
    assert doc_res.status_code == 201
    doc_id = doc_res.json()["id"]

    # 1. Admin checks pending documents
    pending_res = await client.get("/api/admin/documents/pending", headers=auth_headers_admin)
    assert pending_res.status_code == 200
    pending_list = pending_res.json()
    doc_ids = [d["id"] for d in pending_list]
    assert doc_id in doc_ids

    # 2. Admin verifies document
    verify_res = await client.put(f"/api/admin/documents/{doc_id}/verify", headers=auth_headers_admin)
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "VERIFIED"

@pytest.mark.asyncio
async def test_marketplace_visibility_filter(
    client: AsyncClient,
    auth_headers_user1,
    test_data,
):
    # Create a draft vehicle
    draft_res = await client.post(
        "/api/vehicles/",
        json={
            "brand": "DraftBrand",
            "model": "HiddenCar",
            "year": 2024,
            "vehicle_type": "Sedan",
            "fuel_type": "Petrol",
            "transmission": "Automatic",
            "seats": 5,
            "price_per_day": 50.0,
            "description": "Should not appear in marketplace",
            "pickup_location": "Secret Location",
            "status": "DRAFT"
        },
        headers=auth_headers_user1
    )
    draft_id = draft_res.json()["id"]

    # Search marketplace
    search_res = await client.get("/api/vehicles/?query=HiddenCar")
    assert search_res.status_code == 200
    results = search_res.json()
    matching_ids = [v["id"] for v in results]
    assert draft_id not in matching_ids
