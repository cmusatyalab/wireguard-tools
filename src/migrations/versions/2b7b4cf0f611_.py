"""empty message

Revision ID: 2b7b4cf0f611
Revises: 166e37d1573c
Create Date: 2023-11-20 20:25:51.714837

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2b7b4cf0f611'
down_revision = '166e37d1573c'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('network', schema=None) as batch_op:
        batch_op.add_column(sa.Column('name', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('config', sa.Text(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('network', schema=None) as batch_op:
        batch_op.drop_column('config')
        batch_op.drop_column('name')

    # ### end Alembic commands ###
