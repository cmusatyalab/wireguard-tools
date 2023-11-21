from .database import db
from flask_marshmallow import Marshmallow
import json

ma = Marshmallow()


# Create models
class Peer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    private_key = db.Column(db.String(50))
    address = db.Column(db.String(50))
    dns = db.Column(db.String(50))
    peer_config = db.Column(db.Text)
    network = db.Column(db.Integer)
    description = db.Column(db.Text)


# JSON Schema
class PeerSchema(ma.Schema):
    class Meta:
        fields = ("id", "name", "private_key", "peer_config", "network", "description")


peer_schema = PeerSchema()
peers_schema = PeerSchema(many=True)


def peer_load_test_db():
    # Dummy list for testing
    peer_list = [
        {
            "name": "peer 1",
            "address": "10.10.10.11/32",
            "private_key": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
            "dns": "10.10.10.53",
            "peer_config": {
                "AllowedIPs": ["10.10.10.0/24", "::/24"],
                "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            },
            "network": 1,
            "description": "description 1",
        },
        {
            "name": "peer 2",
            "address": "10.10.10.18/32",
            "private_key": "iISiPl0n4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
            "dns": "10.10.10.53",
            "peer_config": {
                    "AllowedIPs": ["0.0.0.0/0", "::/0"],
                    "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                    "PersistentKeepalive": 25,
                    "Endpoint": "myserver.dyndns.org:51820",
                },
            "network": 1,
            "description": "description 2",
        },
    ]
    for peer in peer_list:
        peer["peer_config"] = json.dumps(peer["peer_config"])   
    db.session.bulk_insert_mappings(Peer, peer_list)
    db.session.commit()
