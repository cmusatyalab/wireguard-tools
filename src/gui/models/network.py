import json
import ipaddress
from .database import db
from flask_marshmallow import Marshmallow

ma = Marshmallow()

# Create models
class Network(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))         
    proxy = db.Column(db.Boolean, default=False)     
    lh_ip = db.Column(db.String(50))
    public_key = db.Column(db.String(50))
    peers_list = db.Column(db.Text)
    base_ip = db.Column(db.String(50))
    subnet = db.Column(db.Integer)
    dns_server = db.Column(db.String(50))   # DNS server setting for peers in this network
    description = db.Column(db.Text)
    config = db.Column(db.Text)
    active = db.Column(db.Boolean, default=False)

    @classmethod
    def append_ip(self, ip, host):
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            return "Please enter a valid IP address"
        base_ip = ip.split('.')[:3]
        base_ip.append(str(host))
        result = '.'.join(base_ip)
        return result

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
        fields = ("id","name", "lighthouse", "lh_ip",  "public_key", "peers_list", "base_ip", "description","config", "active")

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
        proxy = False,
        lh_ip="10.10.11.1",
        public_key="m1cSyM6Veev3vQIMYQ23gr22Qn/Vu3vg5d8xBTu43gE=",
        peers_list=json.dumps(["kHuDnIycdQYOVpSSMLqZwfe8D9eQSElSoIdWBFz8+jo=",]),
        base_ip="10.10.11.0",
        subnet="24",
        dns_server="10.10.11.1",
        description="A basic /24 network",
        config=json.dumps({
            "public_key" : "m1cSyM6Veev3vQIMYQ23gr22Qn/Vu3vg5d8xBTu43gE=",
            "preshared_key" : None,
            "endpoint_host" : "12.13.14.15",
            "endpoint_port": 51820,
            "persistent_keepalive" : 30,
            "allowed_ips": "10.10.11.0/24"
        }),
        active=True
    )
    network2 = Network(
        name="network 2",
        proxy = True,
        lh_ip="172.122.88.1",
        public_key="Wek3/glj4oirvt6gPw3BPL1wLrb47KxXKUwShvBNy0Y=",
        peers_list=json.dumps(["Wek3/glj4oirvt6gPw3BPL1wLrb47KxXKUwShvBNy0Y="]),
        base_ip="172.122.88.0",
        subnet="16",
        dns_server="1.1.1.1,1.1.2.2",
        description="Another network that could be slightly larger and uses the server as a proxy",
        config=json.dumps({
            "public_key" : "Wek3/glj4oirvt6gPw3BPL1wLrb47KxXKUwShvBNy0Y=",
            "preshared_key" : None,
            "endpoint_host" : "140.13.214.15",
            "endpoint_port": 51820,
            "persistent_keepalive" : 30,
            "allowed_ips": "172.122.88.0/16"
        })
    )
    network3 = Network(
        name="network 3",
        proxy = False,
        lh_ip="192.168.43.1",
        public_key="OIa8lH814Mzuo1oIT+AQpe8Wm/9JEIf3Tg6g7t5e1k8=",
        peers_list=json.dumps(["OIa8lH814Mzuo1oIT+AQpe8Wm/9JEIf3Tg6g7t5e1k8="]),
        base_ip="192.168.43.0",
        subnet="24",
        description="A small, closed network",
        config=json.dumps({
            "public_key" : "OIa8lH814Mzuo1oIT+AQpe8Wm/9JEIf3Tg6g7t5e1k8=",
            "preshared_key" : None,
            "endpoint_host" : "99.133.211.115",
            "endpoint_port": 51820,
            "persistent_keepalive" : 30,
            "allowed_ips": "192.168.43.0/24"
        })
    )
    network_list = [network1.__dict__, network2.__dict__, network3.__dict__]
    db.session.bulk_insert_mappings(Network, network_list)
    db.session.commit()
