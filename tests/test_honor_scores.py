import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_honor_score_and_audit_history(
    client: AsyncClient,
    auth_headers_user1,
    auth_headers_user2,
    auth_headers_admin,
):
    # 1. User starts with 100 honor score
    prof_res = await client.get("/api/users/profile/2")
    assert prof_res.status_code == 200
    assert prof_res.json()["honor_score"] == 100
    assert prof_res.json()["honor_category"] == "Trusted"

    # 2. Unauthorized attempt: Regular user 1 tries to adjust User 2's honor score
    unauth_res = await client.put(
        "/api/admin/users/honor-score",
        json={
            "user_id": 2,
            "points_change": -20,
            "reason": "Unauthorized malicious penalty",
        },
        headers=auth_headers_user1,
    )
    assert unauth_res.status_code == 403
    assert "administrative privileges required" in unauth_res.json()["detail"].lower()

    # 3. Authorized Admin adjustment: -15 penalty for confirmed late return
    adj_res = await client.put(
        "/api/admin/users/honor-score",
        json={
            "user_id": 2,
            "points_change": -15,
            "reason": "Confirmed late vehicle return on Booking #1",
            "reference_type": "REPORT",
            "reference_id": 1,
        },
        headers=auth_headers_admin,
    )
    assert adj_res.status_code == 200
    updated_user = adj_res.json()
    assert updated_user["honor_score"] == 85

    # 4. Audit History Preservation: Check User 2's honor score history (both routes)
    history_res = await client.get("/api/users/honor-history", headers=auth_headers_user2)
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 1

    # Verify /api/honor/history endpoint
    honor_history_res = await client.get("/api/honor/history", headers=auth_headers_user2)
    assert honor_history_res.status_code == 200
    assert len(honor_history_res.json()) >= 1

    # Verify /api/honor/score endpoint
    honor_score_res = await client.get("/api/honor/score", headers=auth_headers_user2)
    assert honor_score_res.status_code == 200
    assert honor_score_res.json()["user_id"] == 2
    assert honor_score_res.json()["honor_score"] == 85

    penalty_entry = next(e for e in history if e["points_change"] == -15)
    assert penalty_entry["points_change"] == -15
    assert penalty_entry["change"] == -15
    assert penalty_entry["new_score"] == 85
    assert "late vehicle return" in penalty_entry["reason"].lower()
    assert penalty_entry["reference_type"] == "REPORT"

    # 5. User 2 received notification about score adjustment
    notif_res = await client.get("/api/notifications/", headers=auth_headers_user2)
    assert notif_res.status_code == 200
    nots = notif_res.json()
    honor_notif = next((n for n in nots if n["type"] == "HONOR_ADJUSTMENT"), None)
    assert honor_notif is not None
    assert "-15 pts" in honor_notif["message"]

    # 6. Admin can inspect user's honor history via admin route
    admin_history_res = await client.get("/api/admin/users/2/honor-history", headers=auth_headers_admin)
    assert admin_history_res.status_code == 200
    assert len(admin_history_res.json()) >= 1
