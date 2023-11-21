import json
from .database import db
from flask_marshmallow import Marshmallow

ma = Marshmallow()

# Create models
class Network(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))         # Network friendly name
    lighthouse = db.Column(db.String(50))      #
    lh_ip = db.Column(db.String(50))
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
        fields = ("id","name", "lighthouse", "lh_ip",  "public_key", "peers", "base_ip", "description","config")

class NetworkConfigSchema(ma.Schema):
    class Meta:
        fields = ("id","public_key", "preshared_key", "endpoint_host", "endpoint_port", "persistent_keepalive", "allowed_ips")

network_schema = NetworkSchema()
networks_schema = NetworkSchema(many=True)

network_config_schema = NetworkConfigSchema()
network_configs_schema = NetworkConfigSchema(many=True)

def network_load_test_db():
    # Dummy list for testing
    network1 = Network(
        name="network 1",
        lighthouse="lighthouse 1",
        lh_ip="10.10.11.1",
        public_key="public_key 1",
        peers=json.dumps({
            "public_key" : "",
            "preshared_key" : None,
            "endpoint_host" : "12.13.14.15",
            "endpoint_port":51820,
            "persistent_keepalive" : 30,
            "allowed_ips": "10.10.11.1/32"
        }),
        base_ip="10.10.11.0",
        description="Abasic /24 network",
        config=json.dumps({
            "public_key" : "",
            "preshared_key" : None,
            "endpoint_host" : "12.13.14.15",
            "endpoint_port": 51820,
            "persistent_keepalive" : 30,
            "allowed_ips": "10.10.11.0/24"
        })
    )
    network2 = Network(
        name="network 2",
        lighthouse="lighthouse 2",
        lh_ip="172.122.88.1",
        public_key="public_key 1",
        peers="",
        base_ip="172.122.88.0",
        description="Another network that could be slightly larger",
        config=json.dumps({
            "public_key" : "",
            "preshared_key" : None,
            "endpoint_host" : "140.13.214.15",
            "endpoint_port": 51820,
            "persistent_keepalive" : 30,
            "allowed_ips": "172.122.88.0/16"
        })
    )
    network_list = [network1.__dict__, network2.__dict__]
    db.session.bulk_insert_mappings(Network, network_list)
    db.session.commit()
