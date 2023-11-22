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
    active = db.Column(db.Boolean, default=False)

    def get_config(self):
        j_config = json.loads(self.config)
        wg_config = f"[Peer]\nPublicKey = {j_config['public_key']}\n"
        allowed_ips = j_config["allowed_ips"]
        if len(allowed_ips) > 0:
            wg_config += f"AllowedIPs = {j_config['allowed_ips']}\n"
        if j_config["endpoint_host"]:
            wg_config += f"Endpoint = {j_config['endpoint_host']}:{j_config['endpoint_port']}\n"
        if j_config["persistent_keepalive"]:
            wg_config += f"PersistentKeepalive = {j_config['persistent_keepalive']}\n"
        if j_config["preshared_key"]:
            wg_config += f"PresharedKey = {j_config['preshared_key']}\n"
        
        return wg_config

# JSON Schema
class PeerSchema(ma.Schema):
    class Meta:
        fields = ("id", "name", "private_key", "peer_config", "network", "description", "active")


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
                "Endpoint": "myserver.dyndns.org:51820",
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
