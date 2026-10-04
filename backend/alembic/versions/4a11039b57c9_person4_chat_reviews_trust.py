"""person4_chat_reviews_trust

Revision ID: 4a11039b57c9
Revises: 3bef039b57c9
Create Date: 2026-10-02 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '4a11039b57c9'
down_revision: Union[str, None] = '3bef039b57c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user1_id', sa.Integer(), nullable=False),
        sa.Column('user2_id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user1_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user2_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)
    op.create_index(op.f('ix_conversations_user1_id'), 'conversations', ['user1_id'], unique=False)
    op.create_index(op.f('ix_conversations_user2_id'), 'conversations', ['user2_id'], unique=False)
    op.create_index(op.f('ix_conversations_booking_id'), 'conversations', ['booking_id'], unique=False)

    # 2. Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)
    op.create_index(op.f('ix_messages_conversation_id'), 'messages', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_messages_sender_id'), 'messages', ['sender_id'], unique=False)
    op.create_index(op.f('ix_messages_created_at'), 'messages', ['created_at'], unique=False)
    op.create_index(op.f('ix_messages_is_read'), 'messages', ['is_read'], unique=False)

    # 3. Add payload_json to notifications
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.add_column(sa.Column('payload_json', sa.Text(), nullable=True))

    # 4. Add updated_at and is_hidden to reviews
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('is_hidden', sa.Boolean(), nullable=False, server_default='0'))

    # 5. Add reference_type and reference_id to honor_score_history
    with op.batch_alter_table('honor_score_history', schema=None) as batch_op:
        batch_op.add_column(sa.Column('reference_type', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('reference_id', sa.Integer(), nullable=True))

    # 6. Add booking_id, review_id, resolved_at to reports
    with op.batch_alter_table('reports', schema=None) as batch_op:
        batch_op.add_column(sa.Column('booking_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('review_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_foreign_key('fk_reports_booking_id', 'bookings', ['booking_id'], ['id'], ondelete='SET NULL')
        batch_op.create_foreign_key('fk_reports_review_id', 'reviews', ['review_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    with op.batch_alter_table('reports', schema=None) as batch_op:
        batch_op.drop_constraint('fk_reports_review_id', type_='foreignkey')
        batch_op.drop_constraint('fk_reports_booking_id', type_='foreignkey')
        batch_op.drop_column('resolved_at')
        batch_op.drop_column('review_id')
        batch_op.drop_column('booking_id')

    with op.batch_alter_table('honor_score_history', schema=None) as batch_op:
        batch_op.drop_column('reference_id')
        batch_op.drop_column('reference_type')

    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.drop_column('is_hidden')
        batch_op.drop_column('updated_at')

    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_column('payload_json')

    op.drop_index(op.f('ix_messages_is_read'), table_name='messages')
    op.drop_index(op.f('ix_messages_created_at'), table_name='messages')
    op.drop_index(op.f('ix_messages_sender_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_conversation_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_table('messages')

    op.drop_index(op.f('ix_conversations_booking_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_user2_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_user1_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_id'), table_name='conversations')
    op.drop_table('conversations')
