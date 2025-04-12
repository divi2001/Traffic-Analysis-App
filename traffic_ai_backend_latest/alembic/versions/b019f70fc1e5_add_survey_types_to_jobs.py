"""add_survey_types_to_jobs

Revision ID: b019f70fc1e5
Revises: 33cccf67fa6b
Create Date: 2025-04-13 00:32:56.767178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b019f70fc1e5'
down_revision: Union[str, None] = '33cccf67fa6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('jobs', sa.Column('survey_types', sa.String(), nullable=True))
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('jobs', 'survey_types')
    pass
