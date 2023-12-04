import traceback
from flask import Blueprint, render_template, request
from gui.models import db, Network, subnets
from . import helpers
import json

networks = Blueprint("networks", __name__, url_prefix="/networks")

## FUNCTIONS ##
def query_all_networks():
    network_query = Network.query.all()
    #TODO: create a more robust error handling system
    for network in network_query:
        if network.peers_list:
            try:
                network.peers_list = json.loads(network.peers_list)
            except:
                network.peers_list = "Json error"
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
    # network = next((item for item in network_list if item["id"] == int(network_id)), None)
    network = Network.query.filter_by(id=network_id).first()
    #print(f"Found: {network}")

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
            subnets=subnets,
            network=network,
            s_button="Update",
        )
    else:
        message = "Invalid request method"
        return render_template("network_detail.html", network=network, subnets=subnets, message=message)


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
            subnets=subnets,
            s_button="Add",
        )

@networks.route("/delete/<int:network_id>", methods=["POST"])
def network_delete(network_id):
    network = Network.query.filter_by(id=network_id).first()
    db.session.delete(network)
    db.session.commit()
    message = "Network deleted successfully"
    network_list = query_all_networks()
    return render_template("networks.html", message=message, networks=network_list)

@networks.route("/activate/<int:network_id>", methods=["POST"])
def network_activate(network_id):
    message = ""
    sudo_password = request.form.get('sudoPassword')
    network = Network.query.filter_by(id=network_id).first()
    if network.config_name in helpers.get_adapter_names():
        message += "Network already active"
        network.active = True
        db.session.commit()
        network_list = query_all_networks()
        return render_template("networks.html", message=message, networks=network_list)
    try:
        helpers.run_sudo("wg-quick up " + network.config_name, sudo_password)
    except Exception as e:
        traceback.print_exc()
        message += "Error activating network: " + str(e)
        network_list = query_all_networks()
    else:
        network.active = True
        db.session.commit()
        message += "Network activated successfully"
        network_list = query_all_networks()
    finally:
        return render_template("networks.html", message=message, networks=network_list)

@networks.route("/deactivate/<int:network_id>", methods=["POST"])
def network_deactivate(network_id):
    message = ""
    sudo_password = request.form.get('sudoPassword')
    network = Network.query.filter_by(id=network_id).first()
    try:
        helpers.run_sudo("wg-quick down " + network.config_name, sudo_password)
    except Exception as e:
        traceback.print_exc()
        message += "Error activating network: " + str(e)
        network_list = query_all_networks()
    else:
        network.active = False
        db.session.commit()
        message += "Network activated successfully"
        network_list = query_all_networks()
    finally:
        return render_template("networks.html", message=message, networks=network_list)

