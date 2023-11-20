from .database import db
from flask_marshmallow import Marshmallow

ma = Marshmallow()

# Create models
class Network(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lighthouse = db.Column(db.String(50))
    lh_ip = db.Column(db.String(50))
    lh_port = db.Column(db.Integer)
    public_key = db.Column(db.String(50))
    peers = db.Column(db.String(50))
    base_ip = db.Column(db.String(50))
    description = db.Column(db.Text)

# JSON Schema
class NetworkSchema(ma.Schema):
    class Meta:
        fields = ("id", "lighthouse", "lh_ip", "lh_port", "public_key", "peers", "base_ip", "description")

network_schema = NetworkSchema()
networks_schema = NetworkSchema(many=True)