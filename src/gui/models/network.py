from .database import db
from flask_marshmallow import Marshmallow

ma = Marshmallow()

# Create models
class Network(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    lighthouse = db.Column(db.String(50))
    lh_ip = db.Column(db.String(50))
    lh_port = db.Column(db.Integer)
    public_key = db.Column(db.String(50))
    peers = db.Column(db.Text)
    base_ip = db.Column(db.String(50))
    description = db.Column(db.Text)
    config = db.Column(db.Text)

class Network_Config(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    public_key = db.Column(db.String(50), nullable=False)
    preshared_key = db.Column(db.String(50))
    endpoint_host = db.Column(db.String(50))
    endpoint_port = db.Column(db.Integer)
    persistent_keepalive = db.Column(db.Integer)
    allowed_ips = db.Column(db.String(50))

# JSON Schema
class NetworkSchema(ma.Schema):
    class Meta:
        fields = ("id","name", "lighthouse", "lh_ip", "lh_port", "public_key", "peers", "base_ip", "description","config")

class NetworkConfigSchema(ma.Schema):
    class Meta:
        fields = ("id","public_key", "preshared_key", "endpoint_host", "endpoint_port", "persistent_keepalive", "allowed_ips")

network_schema = NetworkSchema()
networks_schema = NetworkSchema(many=True)

network_config_schema = NetworkConfigSchema()
network_configs_schema = NetworkConfigSchema(many=True)