"""baseline traffic_logs

Revision ID: a54a5873f3c5
Revises: d3c1c7ee342d
Create Date: 2025-09-29 09:00:14.017822

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a54a5873f3c5'
down_revision: Union[str, Sequence[str], None] = 'd3c1c7ee342d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     op.create_table(
        'traffic_logs',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('client_ip', sa.String(50), nullable=False),
        sa.Column('inbound', sa.Integer, nullable=False),
        sa.Column('outbound', sa.Integer, nullable=False),
        sa.Column('protocols', postgresql.JSONB, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now())
    )


def downgrade() -> None:
    op.drop_table('traffic_logs')
