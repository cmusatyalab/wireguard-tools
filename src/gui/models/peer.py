from .database import db
from flask_marshmallow import Marshmallow

ma = Marshmallow()

# Create models
class Peer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    private_key = db.Column(db.String(50))
    address = db.Column(db.String(50))
    dns = db.Column(db.String(50))
    peer_config = db.Column(db.String(50))
    network = db.Column(db.Integer)
    description = db.Column(db.Text)

# JSON Schema
class PeerSchema(ma.Schema):
    class Meta:
        fields = ("id", "name", "private_key", "peer_config", "network", "description")

peer_schema = PeerSchema()
peers_schema = PeerSchema(many=True)
