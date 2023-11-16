from gui import app
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

# sqlalchemy instance
db = SQLAlchemy(app)
ma = Marshmallow(app)


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


class Peer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    private_key = db.Column(db.String(50))
    config = db.Column(db.String(50))
    network = db.Column(db.Integer)
    description = db.Column(db.Text)


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


class PeerSchema(ma.Schema):
    class Meta:
        fields = ("id", "name", "config", "network", "description")


config_schema = ConfigSchema()
configs_schema = ConfigSchema(many=True)
peer_schema = PeerSchema()
peers_schema = PeerSchema(many=True)


if __name__ == "__main__":
    db.create_all()
    conf1 = Config(
        **{
            "interface": {
                "address": "10.10.10.11/32",
                "listern_port": "51820",
                "private_key": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
            },
            "peer": {
                "AllowedIPs": ["0.0.0.0/0", "::/0"],
                "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            },
        }
    )
    conf2 = Config(
        **{
            "interface": {
                "address": "10.10.10.17/32",
                "listern_port": "51820",
                "private_key": "iISiPlI8UHSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
            },
            "peer": {
                "AllowedIPs": ["0.0.0.0/0", "::/0"],
                "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            },
        }
    )

    peer1 = Peer(name="peer 1", config=conf1, network=1, description="description 1")
    peer2 = Peer(name="peer 2", config=conf2, network=1, description="description 2")

    db.session.add_all([conf1, conf2, peer1, peer2])
    db.session.commit()
