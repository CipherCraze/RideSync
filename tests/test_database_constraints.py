import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from app.models.message import Message
from app.models.conversation import Conversation
from app.models.review import Review
from app.models.notification import Notification
from app.models.honor_score_history import HonorScoreHistory

@pytest.mark.asyncio
async def test_database_model_constraints(db_session: AsyncSession, test_data):
    now = datetime.now(timezone.utc)

    # 1. Message without required content fails
    with pytest.raises(Exception):
        msg = Message(conversation_id=1, sender_id=1, content=None, is_read=False, created_at=now)
        db_session.add(msg)
        await db_session.commit()
    await db_session.rollback()

    # 2. Conversation creation with valid users succeeds
    conv = Conversation(user1_id=1, user2_id=2, created_at=now, updated_at=now)
    db_session.add(conv)
    await db_session.commit()
    assert conv.id is not None

    # 3. Notification creation with valid user and payload succeeds
    notif = Notification(
        user_id=1,
        title="Security Alert",
        message="New sign-in from a new device.",
        type="SECURITY",
        is_read=False,
        payload_json='{"ip": "127.0.0.1"}',
        created_at=now,
    )
    db_session.add(notif)
    await db_session.commit()
    assert notif.id is not None
    assert notif.payload_json == '{"ip": "127.0.0.1"}'

    # 4. Honor Score History with backward-compatible aliases
    hist = HonorScoreHistory(
        user_id=1,
        old_score=100,
        new_score=95,
        change=-5,
        reason="Test penalty",
        reference_type="MANUAL",
        created_at=now,
    )
    db_session.add(hist)
    await db_session.commit()
    assert hist.id is not None
    assert hist.previous_score == 100
    assert hist.points_change == -5
    assert hist.old_score == 100
    assert hist.change == -5
