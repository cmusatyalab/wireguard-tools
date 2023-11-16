from .database import db
from flask_marshmallow import Marshmallow

ma = Marshmallow()

# Create models
class Peer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    private_key = db.Column(db.String(50))
    config = db.Column(db.String(50))
    network = db.Column(db.Integer)
    description = db.Column(db.Text)

# JSON Schema
class PeerSchema(ma.Schema):
    class Meta:
        fields = ("id", "name", "config", "network", "description")

peer_schema = PeerSchema()
peers_schema = PeerSchema(many=True)
