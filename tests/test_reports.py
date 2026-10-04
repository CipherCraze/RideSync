import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_reports_and_moderation_workflow(
    client: AsyncClient,
    auth_headers_user1,
    auth_headers_user2,
    auth_headers_admin,
):
    # 0. User 2 posts a review on completed booking #3
    rev_create = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 3,
            "rating": 1,
            "comment": "Host was uncooperative and rude.",
            "review_type": "RENTER_TO_OWNER",
        },
        headers=auth_headers_user2,
    )
    assert rev_create.status_code == 201
    test_review_id = rev_create.json()["id"]

    # 1. User 1 files a report against User 2 for late vehicle return
    rep_res = await client.post(
        "/api/reports/",
        json={
            "reported_user_id": 2,
            "booking_id": 1,
            "reason": "LATE_RETURN",
            "details": "User returned the vehicle 3 hours late without communicating.",
        },
        headers=auth_headers_user1,
    )
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    rep_id = rep_data["id"]
    assert rep_data["status"] == "OPEN"
    assert rep_data["reporter_id"] == 1
    assert rep_data["reported_user_id"] == 2

    # 2. User 1 files a report on the defamatory review
    rev_rep_res = await client.post(
        "/api/reports/",
        json={
            "review_id": test_review_id,
            "reason": "ABUSIVE_REVIEW",
            "description": "This review contains defamatory and inaccurate statements.",
        },
        headers=auth_headers_user1,
    )
    assert rev_rep_res.status_code == 201
    assert rev_rep_res.json()["review_id"] == test_review_id

    # 3. User 1 checks their filed reports
    my_reports_res = await client.get("/api/reports/my-reports", headers=auth_headers_user1)
    assert my_reports_res.status_code == 200
    my_reps = my_reports_res.json()
    assert len(my_reps) >= 2

    # 4. SECURITY: Regular User 1 cannot view admin reports list
    unauth_list = await client.get("/api/admin/reports", headers=auth_headers_user1)
    assert unauth_list.status_code == 403

    # 5. Admin lists reports
    admin_list_res = await client.get("/api/admin/reports", headers=auth_headers_admin)
    assert admin_list_res.status_code == 200
    all_reps = admin_list_res.json()
    assert len(all_reps) >= 2

    # 6. SECURITY: Regular User 1 cannot update report status
    unauth_update = await client.put(
        f"/api/admin/reports/{rep_id}",
        json={"status": "RESOLVED"},
        headers=auth_headers_user1,
    )
    assert unauth_update.status_code == 403

    # 7. Admin updates report to UNDER_REVIEW
    reviewing_res = await client.put(
        f"/api/admin/reports/{rep_id}",
        json={
            "status": "UNDER_REVIEW",
            "admin_notes": "Checking vehicle telematics and return timestamps.",
        },
        headers=auth_headers_admin,
    )
    assert reviewing_res.status_code == 200
    assert reviewing_res.json()["status"] == "UNDER_REVIEW"

    # 8. Admin resolves report, applies honor score penalty on reported user, and resolves ticket
    resolve_res = await client.put(
        f"/api/admin/reports/{rep_id}",
        json={
            "status": "RESOLVED",
            "admin_notes": "Confirmed 3 hour delay without notice. Applied -10 honor score deduction.",
            "honor_score_penalty": 10,
        },
        headers=auth_headers_admin,
    )
    assert resolve_res.status_code == 200
    resolved_data = resolve_res.json()
    assert resolved_data["status"] == "RESOLVED"
    assert resolved_data["resolved_at"] is not None

    # Check that User 2 received penalty (score was 85 from honor test or 100, deducted by 10)
    user2_prof = await client.get("/api/users/profile/2")
    assert user2_prof.json()["honor_score"] <= 90

    # 9. Review Moderation: Admin hides abusive review using JSON request body (Person 4 API Contract)
    hide_res = await client.put(
        f"/api/admin/reviews/{test_review_id}/moderate",
        json={"is_hidden": True, "reason": "Abusive language in comments"},
        headers=auth_headers_admin,
    )
    assert hide_res.status_code == 200
    assert hide_res.json()["is_hidden"] is True

    # Also test query parameter variation
    unhide_res = await client.put(
        f"/api/admin/reviews/{test_review_id}/moderate?is_hidden=true",
        headers=auth_headers_admin,
    )
    assert unhide_res.status_code == 200
    assert unhide_res.json()["is_hidden"] is True

    # 10. Verify hidden review is excluded from public vehicle/user review listings
    user_revs = await client.get("/api/reviews/user/1")
    assert user_revs.status_code == 200
    review_ids = [r["id"] for r in user_revs.json()]
    assert test_review_id not in review_ids
