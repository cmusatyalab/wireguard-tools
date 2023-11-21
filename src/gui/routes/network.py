from flask import Blueprint, render_template, request
from gui.models import db, Network
import json

networks = Blueprint("networks", __name__, url_prefix="/networks")

## FUNCTIONS ##
def query_all_networks():
    network_query = Network.query.all()
    #TODO: ate a more robust error handling system
    for network in network_query:
        try:
            network.peers = json.loads(network.peers)
        except:
            network.peers = "Json error"
            print(f"Json error in peers for network {network.name}")
        try:
            network.config = json.loads(network.config)
        except:
            network.config = "Json error"
            print(f"Json error in config for network {network.name}")

    return network_query


## ROUTES ##
@networks.route("/", methods=["GET"])
def networks_all():
    network_list = query_all_networks()
    return render_template("networks.html", networks=network_list)


@networks.route("/<int:network_id>", methods=["GET", "POST"])
def network_detail(network_id):
    print(network_id)
    # network = next((item for item in network_list if item["id"] == int(network_id)), None)
    network = Network.query.filter_by(id=network_id).first()
    print(f"Found: {network}")

    if request.method == "POST":
        if request.method == "POST":
            network.name = request.form["name"]
            network.lighthouse = request.form["lighthouse"]
            network.lh_ip = request.form["lh_ip"]
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
    new_network["name"] = 1
    if request.method == "POST":
        name = request.form["name"]
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
        network_list = query_all_networks()
        return render_template("networks.html", message=message, networks=network_list)
    else:
        return render_template(
            "network_detail.html",
            network=new_network,
            s_button="Add",
        )


