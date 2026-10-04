import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.notification_service import NotificationService

@pytest.mark.asyncio
async def test_create_notification_service(db_session: AsyncSession, test_data):
    service = NotificationService(db_session)
    notif = await service.notify(
        user_id=1,
        type="BOOKING_UPDATE",
        title="Trip Confirmed",
        message="Your vehicle rental has been confirmed.",
        payload={"booking_id": 1, "status": "CONFIRMED"},
        link_url="/my-rentals",
    )
    assert notif.id is not None
    assert notif.user_id == 1
    assert notif.type == "BOOKING_UPDATE"
    assert notif.is_read is False
    assert "booking_id" in notif.payload_json

    # Test notif_type keyword argument (Person 2 & 3 integration contract)
    notif2 = await service.notify(
        user_id=1,
        notif_type="GEOFENCE_ALERT",
        title="Geofence Boundary Alert",
        message="Vehicle exited designated zone.",
    )
    assert notif2.type == "GEOFENCE_ALERT"

@pytest.mark.asyncio
async def test_notifications_api_flow(client: AsyncClient, auth_headers_user1):
    # 1. Unread count before
    res = await client.get("/api/notifications/unread-count", headers=auth_headers_user1)
    assert res.status_code == 200
    unread_before = res.json()["unread_count"]
    assert unread_before >= 1

    # 2. List notifications
    list_res = await client.get("/api/notifications/", headers=auth_headers_user1)
    assert list_res.status_code == 200
    nots = list_res.json()
    assert len(nots) >= 1
    first_notif_id = nots[0]["id"]

    # 3. Mark one as read
    read_res = await client.put(f"/api/notifications/{first_notif_id}/read", headers=auth_headers_user1)
    assert read_res.status_code == 200
    assert "marked as read" in read_res.json()["message"]

    # 4. Mark all as read (test both /read-all and contract /mark-all-read)
    all_read_res = await client.put("/api/notifications/mark-all-read", headers=auth_headers_user1)
    assert all_read_res.status_code == 200
    all_read_res_legacy = await client.put("/api/notifications/read-all", headers=auth_headers_user1)
    assert all_read_res_legacy.status_code == 200

    # 5. Unread count after
    after_res = await client.get("/api/notifications/unread-count", headers=auth_headers_user1)
    assert after_res.status_code == 200
    assert after_res.json()["unread_count"] == 0

@pytest.mark.asyncio
async def test_notifications_unauthenticated(client: AsyncClient):
    res = await client.get("/api/notifications/")
    assert res.status_code == 401
