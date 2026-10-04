import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_chat_lifecycle_and_security(
    client: AsyncClient,
    auth_headers_user1,
    auth_headers_user2,
    auth_headers_user3
):
    # 1. User 1 cannot chat with self
    self_res = await client.post(
        "/api/chat/conversations",
        json={"recipient_id": 1},
        headers=auth_headers_user1,
    )
    assert self_res.status_code == 400
    assert "cannot start a conversation with yourself" in self_res.json()["detail"].lower()

    # 2. User 1 creates conversation with User 2
    conv_res = await client.post(
        "/api/chat/conversations",
        json={"recipient_id": 2, "booking_id": 1},
        headers=auth_headers_user1,
    )
    assert conv_res.status_code == 201
    conv_data = conv_res.json()
    conv_id = conv_data["id"]
    assert conv_data["user1_id"] in [1, 2]
    assert conv_data["user2_id"] in [1, 2]
    assert conv_data["booking_id"] == 1

    # 3. User 2 finds the existing conversation (tests participant_id contract parameter)
    find_res = await client.post(
        "/api/chat/conversations",
        json={"participant_id": 1, "booking_id": 1},
        headers=auth_headers_user2,
    )
    assert find_res.status_code == 201
    assert find_res.json()["id"] == conv_id

    # 4. User 1 sends message
    msg_res = await client.post(
        f"/api/chat/conversations/{conv_id}/messages",
        json={"content": "Hello Bob, where will we meet for pickup?"},
        headers=auth_headers_user1,
    )
    assert msg_res.status_code == 201
    msg_data = msg_res.json()
    assert msg_data["content"] == "Hello Bob, where will we meet for pickup?"
    assert msg_data["sender_id"] == 1
    assert msg_data["is_read"] is False

    # 5. User 2 checks unread message count
    unread_res = await client.get("/api/chat/unread-count", headers=auth_headers_user2)
    assert unread_res.status_code == 200
    assert unread_res.json()["unread_count"] >= 1

    # 6. User 2 retrieves messages
    get_msgs_res = await client.get(
        f"/api/chat/conversations/{conv_id}/messages",
        headers=auth_headers_user2,
    )
    assert get_msgs_res.status_code == 200
    msgs = get_msgs_res.json()
    assert len(msgs) >= 1
    assert msgs[-1]["content"] == "Hello Bob, where will we meet for pickup?"

    # 7. User 2 marks messages as read
    read_res = await client.put(
        f"/api/chat/conversations/{conv_id}/read",
        headers=auth_headers_user2,
    )
    assert read_res.status_code == 200

    # 8. User 2 unread count drops to 0
    unread_res_after = await client.get("/api/chat/unread-count", headers=auth_headers_user2)
    assert unread_res_after.status_code == 200
    assert unread_res_after.json()["unread_count"] == 0

    # 9. SECURITY: User 3 (outsider) cannot access or read conversation
    sec_read = await client.get(
        f"/api/chat/conversations/{conv_id}/messages",
        headers=auth_headers_user3,
    )
    assert sec_read.status_code == 403
    assert "not authorized" in sec_read.json()["detail"].lower()

    # 10. SECURITY: User 3 cannot send messages in conversation
    sec_send = await client.post(
        f"/api/chat/conversations/{conv_id}/messages",
        json={"content": "I am an unauthorized intruder!"},
        headers=auth_headers_user3,
    )
    assert sec_send.status_code == 403
    assert "not authorized" in sec_send.json()["detail"].lower()


@pytest.mark.asyncio
async def test_empty_message_and_notification(
    client: AsyncClient,
    auth_headers_user1,
    auth_headers_user2
):
    # 1. Create or find conversation
    conv_res = await client.post(
        "/api/chat/conversations",
        json={"recipient_id": 2},
        headers=auth_headers_user1,
    )
    assert conv_res.status_code in [200, 201]
    conv_id = conv_res.json()["id"]

    # 2. Empty message fails validation
    empty_res = await client.post(
        f"/api/chat/conversations/{conv_id}/messages",
        json={"content": ""},
        headers=auth_headers_user1,
    )
    assert empty_res.status_code in [400, 422]

    # 3. Valid message generates MESSAGE_RECEIVED notification for recipient
    msg_res = await client.post(
        f"/api/chat/conversations/{conv_id}/messages",
        json={"content": "Notification check message"},
        headers=auth_headers_user1,
    )
    assert msg_res.status_code == 201

    notif_res = await client.get("/api/notifications/", headers=auth_headers_user2)
    assert notif_res.status_code == 200
    nots = notif_res.json()
    assert any(n["type"] == "MESSAGE_RECEIVED" for n in nots)

