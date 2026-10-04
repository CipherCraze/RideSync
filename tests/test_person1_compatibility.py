import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_person1_vehicles_and_auth_integrity(client: AsyncClient, test_data, auth_headers_user1):
    """
    Verify Person 1's vehicle listing and public browsing endpoints remain completely functional.
    """
    # Test public vehicles listing
    resp = await client.get("/api/vehicles/")
    assert resp.status_code == 200
    vehicles = resp.json()
    assert isinstance(vehicles, list)

    # Test creating a vehicle as owner
    vehicle_payload = {
        "brand": "Honda",
        "model": "Civic Test",
        "year": 2022,
        "vehicle_type": "Sedan",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "seats": 5,
        "price_per_day": 100.0,
        "description": "Clean reliable car",
        "pickup_location": "Downtown Garage",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "images": []
    }
    create_resp = await client.post("/api/vehicles/", json=vehicle_payload, headers=auth_headers_user1)
    assert create_resp.status_code in (200, 201)
    created_data = create_resp.json()
    assert created_data["brand"] == "Honda"
    assert created_data["model"] == "Civic Test"
    vehicle_id = created_data["id"]

    # Verify vehicle details
    detail_resp = await client.get(f"/api/vehicles/{vehicle_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == vehicle_id

    # Verify owner's vehicle list
    my_vehicles_resp = await client.get("/api/vehicles/my-listings", headers=auth_headers_user1)
    assert my_vehicles_resp.status_code == 200
    my_vehicles = my_vehicles_resp.json()
    assert any(v["id"] == vehicle_id for v in my_vehicles)
