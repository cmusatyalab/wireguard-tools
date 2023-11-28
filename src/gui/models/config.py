from .database import db
from flask_marshmallow import Marshmallow

ma = Marshmallow()

# Create models
class Config(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    public_key = db.Column(db.String(50), nullable=False)
    preshared_key = db.Column(db.String(50))
    endpoint_host = db.Column(db.String(50))
    endpoint_port = db.Column(db.Integer)
    persistent_keepalive = db.Column(db.Integer)
    allowed_ips = db.Column(db.String(50))
    friendly_name = db.Column(db.String(50))
    friendly_json = db.Column(db.String(50))
    last_handshake = db.Column(db.Float)
    rx_bytes = db.Column(db.Integer)
    tx_bytes = db.Column(db.Integer)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# JSON Schema
class ConfigSchema(ma.Schema):
    class Meta:
        fields = (
            "id",
            "public_key",
            "preshared_key",
            "endpoint_host",
            "endpoint_port",
            "persistent_keepalive",
            "allowed_ips",
            "friendly_name",
            "friendly_json",
            "last_handshake",
            "rx_bytes",
            "tx_bytes",
            "description",
        )


config_schema = ConfigSchema()
configs_schema = ConfigSchema(many=True)

def config_load_test_db():
    pass