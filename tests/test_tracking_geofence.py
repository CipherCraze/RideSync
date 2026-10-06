import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_fleet_tracking_owner(client: AsyncClient, auth_headers_user1):
    """Host should see their fleet vehicles in tracking response."""
    response = await client.get("/api/tracking/fleet", headers=auth_headers_user1)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(v["vehicle_id"] == 1 for v in data)
    fleet_v1 = next(v for v in data if v["vehicle_id"] == 1)
    assert "accuracy_radius_m" in fleet_v1
    assert "obfuscated_latitude" in fleet_v1
    assert "obfuscated_longitude" in fleet_v1

@pytest.mark.asyncio
async def test_vehicle_simulation_and_ping_storage(client: AsyncClient, auth_headers_user1):
    """Simulate vehicle transit to breach state and verify telemetry update and ping storage."""
    # 1. Simulate BREACH_FAR
    sim_res = await client.post(
        "/api/tracking/vehicles/1/simulate",
        json={"target_state": "BREACH_FAR"},
        headers=auth_headers_user1
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["is_geofence_breached"] is True
    assert sim_data["breach_distance_km"] > 0
    # Precision sharpens during distant breach
    assert sim_data["accuracy_radius_m"] <= 100.0

    # 2. Retrieve location history
    history_res = await client.get(
        "/api/tracking/vehicles/1/history?limit=10",
        headers=auth_headers_user1
    )
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 1
    assert history[0]["vehicle_id"] == 1
    assert "latitude" in history[0]
    assert "longitude" in history[0]

@pytest.mark.asyncio
async def test_location_history_unauthorized_user(client: AsyncClient, auth_headers_user3):
    """Unrelated user without active booking must be forbidden from accessing vehicle tracking history."""
    response = await client.get(
        "/api/tracking/vehicles/1/history",
        headers=auth_headers_user3
    )
    assert response.status_code == 403
    assert "Location history is only accessible" in response.json()["detail"]

@pytest.mark.asyncio
async def test_overdue_location_endpoint(client: AsyncClient, auth_headers_user1, auth_headers_admin):
    """Booking overdue location reporting for host and admin."""
    # Booking 1 is completed, so check response or active status
    response = await client.get(
        "/api/tracking/bookings/1/overdue-location",
        headers=auth_headers_user1
    )
    assert response.status_code == 200
    data = response.json()
    assert data["booking_id"] == 1
    assert "current_latitude" in data
    assert "current_longitude" in data
    assert "emergency_status" in data
