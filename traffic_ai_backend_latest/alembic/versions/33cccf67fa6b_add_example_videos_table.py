"""add_example_videos_table

Revision ID: 33cccf67fa6b
Revises: eb3cb3fb6627
Create Date: 2025-04-08 00:59:55.618885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33cccf67fa6b'
down_revision: Union[str, None] = 'eb3cb3fb6627'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('example_videos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('video_path', sa.String(), nullable=False),
        sa.Column('thumbnail_path', sa.String(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('category', sa.String()),
        sa.Column('views_count', sa.Integer(), server_default=sa.text('0')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_example_videos_id', 'example_videos', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_example_videos_id', table_name='example_videos')
    op.drop_table('example_videos')