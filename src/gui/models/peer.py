from flask import current_app
from .database import db
import json

from typing import List
from wireguard_tools import WireguardKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


# Helper class for dictionary serialization
class TextPickleType(db.TypeDecorator):
    impl = db.Text

    def process_bind_param(self, value, dialect):
        if value is not None:
            value = json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            value = json.loads(value)
        return value


# Peer Model
class Peer(db.Model):
    __tablename__ = "peer"
    id: Mapped[int] = mapped_column(primary_key=True)
    active = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text)
    dns = db.Column(
        db.String(50)
    )  # A peer could have a specific DNS requirement but generally leave it to the network config
    endpoint_host = db.Column(db.String(50))
    listen_port = db.Column(db.Integer)
    name = db.Column(db.String(50))
    network_ip = db.Column(
        db.String(50)
    )  # This is the IP address of the peer without subnet
    lighthouse = db.Column(db.Boolean, default=False)  # Is this a lighthouse peer?
    network_id: Mapped[int] = mapped_column(db.ForeignKey("network.id"))
    # network: Mapped["Network"] = relationship(back_populates="peers_list") # type: ignore
    peers_list = db.Column(db.Text)
    post_up = db.Column(db.Text)
    post_down = db.Column(db.Text)
    preshared_key = db.Column(db.String(50))
    preshared_keys = db.Column(TextPickleType())
    private_key = db.Column(db.String(50))
    subnet = db.Column(
        db.Integer, default=32
    )  # This is the subnet for the Peer network IP

    def get_address(self):
        return self.network_ip + "/" + str(self.subnet)

    def get_peers(self):
        j_config = json.loads(self.peers_list)
        peers = []
        for peer in j_config:
            wg_config = f"[Peer]\nPublicKey = {peer['public_key']}\n"
            allowed_ips = peer["allowed_ips"]
            if peer["endpoint_host"]:
                wg_config += (
                    f"Endpoint = {peer['endpoint_host']}:{peer['endpoint_port']}\n"
                )
            if len(allowed_ips) > 0:
                wg_config += f"AllowedIPs = {peer['allowed_ips']}\n"
            if peer["persistent_keepalive"]:
                wg_config += f"PersistentKeepalive = {peer['persistent_keepalive']}\n"
            if peer["preshared_key"]:
                wg_config += f"PresharedKey = {peer['preshared_key']}\n"

            peers.append(wg_config)
        return peers

    def get_public_key(self) -> WireguardKey:
        public_key = str(WireguardKey(self.private_key).public_key())
        return public_key

    def is_lighthouse(self):
        return self.lighthouse

    def to_dict(self):
        dict_ = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        return dict_


def peer_load_test_db():
    # Dummy list for testing
    peer_list = [
        {
            "name": "peer 1",
            "network_ip": "10.10.11.11/32",
            "private_key": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
            "dns": "10.10.11.53",
            "peers_list": [
                {
                    "Endpoint": "myserver.dyndns.org:51820",
                    "AllowedIPs": ["10.10.11.0/24"],
                    "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                    "PersistentKeepalive": 25,
                    "Endpoint": "myserver.dyndns.org:51820",
                }
            ],
            "network": 1,
            "description": "description 1",
            "active": True,
        },
        {
            "name": "peer 2",
            "network.ip": "10.10.11.18/32",
            "private_key": "iISiPl0n4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
            "dns": "10.10.11.53",
            "peers_list": [
                {
                    "AllowedIPs": ["0.0.0.0/0", "::/0"],
                    "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                    "PersistentKeepalive": 25,
                    "Endpoint": "myserver.dyndns.org:51820",
                }
            ],
            "network": 1,
            "description": "description 2",
        },
        {
            "name": "peer 3",
            "network_ip": "10.10.11.19/32",
            "private_key": "YHmRePvK5Eay19KJe7QYcgNUgKEL4ky5X1xql+UhEGo=",
            "dns": "10.10.11.53",
            "peers_list": {
                "AllowedIPs": ["0.0.0.0/0", "::/0"],
                "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            },
            "network": 1,
            "description": "RasPi honeypot",
        },
        {
            "name": "server 1",
            "network_ip": "10.10.11.1/32",
            "private_key": "wBIQfi2Z+DFhAW7Z57tqVTyG/z1MQpzNwGlWrAcF2F4=",
            "listen_port": 51820,
            "dns": "10.10.11.53",
            "lighthouse": True,
            "peers_list": {
                "AllowedIPs": ["0.0.0.0/0", "::/0"],
                "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            },
            "network": 1,
            "description": "Auto-generated peer for the lighthouse",
        },
        {
            "name": "server 2",
            "network_ip": "172.122.88.1/32",
            "private_key": "KIy+vrfZDJ5KqHm0qrLK58Mqy5iV2OKx+l/vKXfTaXI=",
            "listen_port": 51820,
            "dns": "172.122.88.53",
            "lighthouse": True,
            "peers_list": {
                "AllowedIPs": ["0.0.0.0/0", "::/0"],
                "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            },
            "network": 2,
            "description": "Auto-generated peer for the lighthouse",
        },
        {
            "name": "server 3",
            "network.ip": "192.168.43.1/32",
            "private_key": "aHt3pJBwvbcvlA8sXDCsWuN3tRs20kg8nR8Z4kyayGA=",
            "listen_port": 51820,
            "lighthouse": True,
            "peers_list": {
                "AllowedIPs": ["192.168.43.0/24"],
                "PublicKey": "OIa8lH814Mzuo1oIT+AQpe8Wm/9JEIf3Tg6g7t5e1k8=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            },
            "network": 3,
            "description": "Auto-generated peer for the lighthouse",
        },
    ]

    for peer in peer_list:
        peer["peers_list"] = json.dumps(peer["peers_list"])
    db.session.bulk_insert_mappings(Peer, peer_list)
    db.session.commit()
