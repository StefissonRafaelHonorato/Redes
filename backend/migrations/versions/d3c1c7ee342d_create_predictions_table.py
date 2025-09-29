"""create predictions table

Revision ID: d3c1c7ee342d
Revises: 
Create Date: 2025-09-29 08:57:41.544291

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3c1c7ee342d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('client_ip', sa.String(50), nullable=False),
        sa.Column('prediction', sa.String(20), nullable=False),
        sa.Column('probability', sa.Float, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now())
    )


def downgrade() -> None:
    op.drop_table('predictions')
