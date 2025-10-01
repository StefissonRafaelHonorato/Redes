"""add_forecasts_table

Revision ID: 6444c1efdd9b
Revises: a54a5873f3c5
Create Date: 2025-10-01 10:13:52.506823

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6444c1efdd9b'
down_revision: Union[str, Sequence[str], None] = 'a54a5873f3c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Executa a migration: cria a tabela 'forecasts'.
    """
    op.create_table(
        'forecasts',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('client_ip', sa.String(length=45), nullable=False),
        sa.Column('predicted_value', sa.Float(), nullable=False),
        sa.Column('model_used', sa.String(length=50), nullable=True),
        sa.Column(
            'created_at',
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP')
        )
    )


def downgrade() -> None:
    """
    Reverte a migration: apaga a tabela 'forecasts'.
    """
    op.drop_table('forecasts')