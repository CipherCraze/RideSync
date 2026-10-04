import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_review_validation_and_rules(
    client: AsyncClient,
    auth_headers_user1,
    auth_headers_user2,
    auth_headers_user3
):
    # 1. Invalid rating (> 5) fails validation
    res_high = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 1,
            "rating": 6,
            "comment": "Too good to be true",
        },
        headers=auth_headers_user2,
    )
    assert res_high.status_code in [400, 422]

    # 2. Invalid rating (< 1) fails validation
    res_low = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 1,
            "rating": 0,
            "comment": "Terrible",
        },
        headers=auth_headers_user2,
    )
    assert res_low.status_code in [400, 422]

    # 3. Non-completed booking (Booking #2 is PENDING) cannot be reviewed
    res_pending = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 2,
            "rating": 5,
            "comment": "Nice trip before it even happened",
        },
        headers=auth_headers_user2,
    )
    assert res_pending.status_code == 400
    assert "after rental completion" in res_pending.json()["detail"].lower()

    # 4. User 3 (outsider) cannot review Booking #1
    res_outsider = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 1,
            "rating": 5,
            "comment": "I didn't drive it but it looks great",
        },
        headers=auth_headers_user3,
    )
    assert res_outsider.status_code == 403
    assert "only review bookings you participated in" in res_outsider.json()["detail"].lower()

    # 5. User 1 cannot review themselves
    res_self = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 1,
            "reviewee_id": 1,
            "rating": 5,
            "comment": "I love myself",
        },
        headers=auth_headers_user1,
    )
    assert res_self.status_code == 400
    assert "cannot review yourself" in res_self.json()["detail"].lower()

    # 6. Valid Review: Renter (User 2) reviews Owner (User 1) on Booking #1
    res_valid = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 1,
            "rating": 5,
            "comment": "Alice was fantastic! Car was spotless and fully charged.",
            "review_type": "RENTER_TO_OWNER",
        },
        headers=auth_headers_user2,
    )
    assert res_valid.status_code == 201
    rev_data = res_valid.json()
    assert rev_data["rating"] == 5
    assert rev_data["reviewer_id"] == 2
    assert rev_data["reviewee_id"] == 1
    assert rev_data["booking_id"] == 1

    # 7. CRITICAL RULE: Reviews must NOT directly manipulate honor score!
    # Check Alice's (User 1) profile honor score is still 100
    prof_res = await client.get("/api/users/profile/1")
    assert prof_res.status_code == 200
    assert prof_res.json()["honor_score"] == 100

    # 8. Duplicate review prevention: User 2 cannot review Booking #1 again
    res_dup = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 1,
            "rating": 4,
            "comment": "Second review attempt on same booking",
        },
        headers=auth_headers_user2,
    )
    assert res_dup.status_code == 400
    assert "already submitted a review" in res_dup.json()["detail"].lower()

    # 9. Mutual Review: Owner (User 1) reviews Renter (User 2) on Booking #1
    res_owner_review = await client.post(
        "/api/reviews/",
        json={
            "booking_id": 1,
            "rating": 5,
            "comment": "Bob took wonderful care of the Tesla. Highly recommended!",
            "review_type": "OWNER_TO_RENTER",
        },
        headers=auth_headers_user1,
    )
    assert res_owner_review.status_code == 201
    assert res_owner_review.json()["reviewer_id"] == 1
    assert res_owner_review.json()["reviewee_id"] == 2

    # 10. Check given & received reviews endpoints
    given_res = await client.get("/api/reviews/given", headers=auth_headers_user2)
    assert given_res.status_code == 200
    assert len(given_res.json()) >= 1

    recv_res = await client.get("/api/reviews/received", headers=auth_headers_user1)
    assert recv_res.status_code == 200
    assert len(recv_res.json()) >= 1

    # 11. Eligibility endpoint check
    elig_res = await client.get("/api/reviews/booking/1/eligibility", headers=auth_headers_user2)
    assert elig_res.status_code == 200
    assert elig_res.json()["can_review"] is False
    assert elig_res.json()["already_reviewed"] is True
