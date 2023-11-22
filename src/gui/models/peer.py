from .database import db
from flask_marshmallow import Marshmallow
import json

from wireguard_tools import WireguardKey

ma = Marshmallow()


# Create models
class Peer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    private_key = db.Column(db.String(50))
    address = db.Column(db.String(50))
    dns = db.Column(db.String(50))
    peers_list = db.Column(db.Text)
    network = db.Column(db.Integer)
    description = db.Column(db.Text)
    active = db.Column(db.Boolean, default=False)

    def get_peers(self):
        j_config = json.loads(self.peers_list)
        peers = []
        for peer in j_config:
            wg_config = f"[Peer]\nPublicKey = {peer['public_key']}\n"
            allowed_ips = peer["allowed_ips"]
            if len(allowed_ips) > 0:
                wg_config += f"AllowedIPs = {peer['allowed_ips']}\n"
            if peer["endpoint_host"]:
                wg_config += f"Endpoint = {peer['endpoint_host']}:{peer['endpoint_port']}\n"
            if peer["persistent_keepalive"]:
                wg_config += f"PersistentKeepalive = {peer['persistent_keepalive']}\n"
            if peer["preshared_key"]:
                wg_config += f"PresharedKey = {peer['preshared_key']}\n"
            
            peers.append(wg_config)
        return peers
    
    def get_public_key(self):
        public_key = WireguardKey(self.private_key).public_key()
        return public_key
    
# JSON Schema
class PeerSchema(ma.Schema):
    class Meta:
        fields = ("id", "name", "private_key", "peers_list", "network", "description", "active")


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
            "peers_list": [{
                "Endpoint": "myserver.dyndns.org:51820",
                "AllowedIPs": ["10.10.10.0/24", "::/24"],
                "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            }],
            "network": 1,
            "description": "description 1",
            "active": True,
        },
        {
            "name": "peer 2",
            "address": "10.10.10.18/32",
            "private_key": "iISiPl0n4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
            "dns": "10.10.10.53",
            "peers_list": [{
                    "AllowedIPs": ["0.0.0.0/0", "::/0"],
                    "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                    "PersistentKeepalive": 25,
                    "Endpoint": "myserver.dyndns.org:51820",
                }],
            "network": 1,
            "description": "description 2",
        },
        {
            "name": "peer 3",
            "address": "10.10.10.19/32",
            "private_key": "YHmRePvK5Eay19KJe7QYcgNUgKEL4ky5X1xql+UhEGo=",
            "dns": "10.10.10.53",
            "peers_list": {
                    "AllowedIPs": ["0.0.0.0/0", "::/0"],
                    "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                    "PersistentKeepalive": 25,
                    "Endpoint": "myserver.dyndns.org:51820",
                },
            "network": 1,
            "description": "RasPi honeypot",
        },
    ]
    for peer in peer_list:
        peer["peers_list"] = json.dumps(peer["peers_list"])   
    db.session.bulk_insert_mappings(Peer, peer_list)
    db.session.commit()
