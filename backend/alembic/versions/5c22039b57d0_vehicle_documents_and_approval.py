"""vehicle_documents_and_approval

Revision ID: 5c22039b57d0
Revises: 4a11039b57c9
Create Date: 2026-10-05 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '5c22039b57d0'
down_revision: Union[str, None] = '4a11039b57c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create vehicle_documents table
    op.create_table(
        'vehicle_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('document_url', sa.Text(), nullable=False),
        sa.Column('document_number', sa.String(length=100), nullable=True),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='PENDING', nullable=False),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['verified_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vehicle_documents_id'), 'vehicle_documents', ['id'], unique=False)
    op.create_index(op.f('ix_vehicle_documents_vehicle_id'), 'vehicle_documents', ['vehicle_id'], unique=False)
    op.create_index(op.f('ix_vehicle_documents_document_type'), 'vehicle_documents', ['document_type'], unique=False)
    op.create_index(op.f('ix_vehicle_documents_status'), 'vehicle_documents', ['status'], unique=False)

    # 2. Add status and rejection_reason to vehicles
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=20), server_default='DRAFT', nullable=False))
        batch_op.add_column(sa.Column('rejection_reason', sa.Text(), nullable=True))
        batch_op.create_index(op.f('ix_vehicles_status'), ['status'], unique=False)

    # 3. Add angle to vehicle_images
    with op.batch_alter_table('vehicle_images', schema=None) as batch_op:
        batch_op.add_column(sa.Column('angle', sa.String(length=50), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('vehicle_images', schema=None) as batch_op:
        batch_op.drop_column('angle')

    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.drop_index(op.f('ix_vehicles_status'))
        batch_op.drop_column('rejection_reason')
        batch_op.drop_column('status')

    op.drop_index(op.f('ix_vehicle_documents_status'), table_name='vehicle_documents')
    op.drop_index(op.f('ix_vehicle_documents_document_type'), table_name='vehicle_documents')
    op.drop_index(op.f('ix_vehicle_documents_vehicle_id'), table_name='vehicle_documents')
    op.drop_index(op.f('ix_vehicle_documents_id'), table_name='vehicle_documents')
    op.drop_table('vehicle_documents')
