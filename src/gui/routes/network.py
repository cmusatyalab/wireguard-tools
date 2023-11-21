from flask import Blueprint, render_template, request
from gui.models import db, Network
import json

networks = Blueprint("networks", __name__, url_prefix="/networks")
# For testing purposes
# network_list = [
#     {"name": "network 1", "address": "10.10.10.0", "description": "description 1", "id": 1},
#     {"name": "network 2", "address": "172.122.88.4", "description": "description 2", "id": 2},
#     {"name": "network 3", "address": "192.168.88.0", "description": "description 3", "id": 3}
# ]


## FUNCTIONS ##
def query_all_networks():
    networks = Network.query.all()
    for network in networks:
        network.peers = json.loads(network.peers)
    return networks


## ROUTES ##
network_list = query_all_networks()


@networks.route("/", methods=["GET", "POST"])
def networks_all():
    if request.method == "POST":
        print("POSTED to networks")
    else:
        return render_template("networks.html", network_list=network_list)


@networks.route("/<int:network_id>", methods=["GET", "POST"])
def network_detail(network_id):
    print(network_id)
    # network = next((item for item in network_list if item["id"] == int(network_id)), None)
    network = network.query.filter_by(id=network_id).first()
    print(f"Found: {network}")

    if request.method == "POST":
        if request.method == "POST":
            network.name = request.form["friendly_name"]
            network.lighthouse = request.form["lighthouse"]
            network.lh_ip = request.form["lh_ip"]
            network.lh_port = request.form["lh_port"]
            network.public_key = request.form["public_key"]
            network.peers = request.form["peers"]
            network.base_ip = request.form["base_ip"]
            network.description = request.form["description"]
            network.config = request.form["config"]

        db.session.commit()
        message = "network updated successfully"
        network_list = query_all_networks()
        return render_template(
            "networks.html", message=message, network_list=network_list
        )

    elif request.method == "GET":
        return render_template(
            "network_detail.html",
            networks=query_all_networks(),
            network=network,
            s_button="Update",
        )
    else:
        message = "Invalid request method"
        return render_template("network_detail.html", network=network, message=message)


@networks.route("/add", methods=["GET", "POST"])
def networks_add():
    new_network = {}
    new_network["public_key"] = ""
    new_network["network"] = 1
    if request.method == "POST":
        name = request.form["friendly_name"]
        lighthouse = request.form["lighthouse"]
        lh_ip = request.form["lh_ip"]
        lh_port = request.form["lh_port"]
        public_key = request.form["public_key"]
        peers = request.form["peers"]
        base_ip = request.form["base_ip"]
        description = request.form["description"]
        config = request.form["config"]

        new_network = Network(
            name=name,
            lighthouse=lighthouse,
            lh_ip=lh_ip,
            lh_port=lh_port,
            public_key=public_key,
            peers=peers,
            base_ip=base_ip,
            description=description,
            config=config,
        )
        db.session.add(new_network)
        db.session.commit()
        message = "network added successfully"
        return render_template("networks.html", message=message, networks=network_list)
    else:
        return render_template(
            "network_detail.html",
            s_button="Add",
        )

def test_networks():
    network1 = Network(
        name="network 1",
        lighthouse="lighthouse 1",
        lh_ip="10.10.11.1",
        lh_port=51820,
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
        description="description 1",
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
        lh_port=51820,
        public_key="public_key 1",
        networks="networks 1",
        base_ip="10.10.11.0",
        description="description 1",
        config="config 1"
    )

    db.session.add(network1)
    db.session.add(network2)
    db.session.commit()
