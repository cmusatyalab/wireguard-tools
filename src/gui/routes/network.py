import traceback
from flask import Blueprint, current_app, flash, jsonify, render_template, request
from flask_login import login_required
from gui.models import db, Network, Peer, subnets
from gui.routes import helpers
import json

networks = Blueprint("networks", __name__, url_prefix="/networks")


## FUNCTIONS ##
def add_network(network, sudo_password):
    # Add a new network to the running server
    network_cmd = f"wg set {network.adapter_name} network {network.get_public_key()} allowed-ips {network.address}/{network.subnet}"
    print(f"Add Network: {network_cmd}")
    try:
        helpers.run_sudo(network_cmd, sudo_password)
    except Exception as e:
        print(e)
        return False
    else:
        return True


def query_all_networks():
    network_query = Network.query.all()
    # TODO: create a more robust error handling system
    for network in network_query:
        if network.peers_list:
            try:
                network.peers_list = json.loads(network.peers_list)
            except:
                network.peers_list = []
                print(f"Json error in peers for network {network.name}")

    return network_query

    
def query_network(network_id):
    network_query = Network.query.get(network_id)
    return network_query

def query_peer(peer_id):
    peer_query = Peer.query.get(peer_id)
    return peer_query


def remove_network(network, sudo_password):
    # Remove a network from the running server
    network_cmd = (
        f"wg set {network.adapter_name} network {network.get_public_key()} remove"
    )
    print(f"Remove Network: {network_cmd}")
    try:
        helpers.run_sudo(network_cmd, sudo_password)
    except Exception as e:
        print(e)
        return False
    else:
        return True


def update_network(network):
    # Update a network on the running server
    #TODO: #10 Add logic to update network on server
    return False


## ROUTES ##
@networks.route("/", methods=["GET"])
@login_required
def networks_all():
    network_list = query_all_networks()
    for network in network_list:
        network.peer_count = helpers.get_peer_count(network.id)
    return render_template("networks.html", networks=network_list)


@networks.route("/<int:network_id>", methods=["GET", "POST"])
@login_required
def network_detail(network_id):
    # network = next((item for item in network_list if item["id"] == int(network_id)), None)
    network = Network.query.filter_by(id=network_id).first()
    # print(f"Found: {network}")
    adapters = helpers.get_adapter_names()
    if request.method == "POST":
        if request.method == "POST":
            network.name = request.form.get("name")
            network.peers = request.form.get("peers")
            network.base_ip = request.form.get("base_ip")
            network.description = request.form.get("description")
            network.private_key = request.form.get("private_key")
            network.adapter_name = request.form.get("adapter_name")
            if request.form.get("lighthouse"):
                network.lighthouse = [query_peer(request.form.get("lighthouse"))]
            network.proxy = request.form.get("proxy")
            if request.form.get("peers_list"):
                network.peers_list = request.form.get("peers_list")
            network.subnet = request.form.get("subnet")
            network.dns_server = request.form.get("dns_server")
            if request.form.get("persistent_keepalive"):
                print(f"Persistent Keepalive: {request.form.get('persistent_keepalive')}")
                network.persistent_keepalive = request.form.get("persistent_keepalive")
            network.allowed_ips = request.form.get("allowed_ips")
            network.active = request.form.get("active")
        if network.adapter_name == "":
            network.adapter_name = "wg0"
        try:
            db.session.commit()
        except Exception as e:
            print(f"Error updating network: {e}")
            message = "Error updating network"
            flash(message, "danger")
            return render_template(
                "network_detail.html", network=network, subnets=subnets
            )

        message = "Network updated successfully"
        network_list = query_all_networks()
        flash(message, "success")
        return render_template("networks.html", network_list=network_list)

    elif request.method == "GET":
        return render_template(
            "network_detail.html",
            subnets=subnets,
            network=network,
            lighthouses=helpers.get_lighthouses(),
            adapters=adapters,
            s_button="Update",
        )
    else:
        message = "Invalid request method"
        flash(message, "warning")
        return render_template("network_detail.html", network=network, subnets=subnets)


@networks.route("/add", methods=["GET", "POST"])
@login_required
def networks_add():
    lighthouses = helpers.get_lighthouses()
    adapters = helpers.get_adapter_names()
    if request.method == "POST":
        lighthouse_list = []
        name = request.form.get("name")
        message = f"Adding network {name}\n"
        if request.form.get("lighthouse"):
            message += f"Lighthouse selected: {request.form.get('lighthouse')}\n"
            lighthouse_list = [Peer.query.get(request.form.get("lighthouse"))]
            private_key = lighthouse_list[0].private_key
        else:
            message += "No lighthouse selected"
            lighthouse_list = []
            private_key = request.form.get("private_key")
        base_ip = request.form.get("base_ip")
        subnet = request.form.get("subnet")
        dns = request.form.get("dns_server")
        description = request.form.get("description")
        allowed_ips = request.form.get("allowed_ips")
        adapter_name = request.form.get("adapter_name")
        if request.form.get("persistent_keepalive"):
            persistent_keepalive = request.form.get("persistent_keepalive")
        else:
            persistent_keepalive = 0
        peers_list = []
        if request.form.get("proxy"):
            proxy = request.form.get("proxy")
        else:
            proxy = False


        # Create a new network object
        # TODO: fix config name rotation
        new_network = Network(
            active=False,
            adapter_name=adapter_name,
            allowed_ips=allowed_ips,
            base_ip=base_ip,
            dns_server=dns,
            description=description,
            lighthouse=lighthouse_list,
            name=name,
            peers_list=peers_list,
            persistent_keepalive=persistent_keepalive,
            private_key=private_key,
            proxy=proxy,
            subnet=subnet,
        )

        if request.form.get("adapter_name"):
            new_network.adapter_name = request.form.get("adapter_name")
        db.session.add(new_network)
        db.session.commit()
        message += "Network added successfully"
        network_list = query_all_networks()
        flash(message, "success")
        return render_template("networks.html", networks=network_list)
    else:
        new_network = {"id": 0, "public_key": "", "name": ""}
        return render_template(
            "network_detail.html",
            network=new_network,
            subnets=subnets,
            lighthouses=lighthouses,
            adapters=adapters,
            s_button="Add",
        )


@networks.route("/update/<int:network_id>", methods=["POST"])
@login_required
def network_update(network_id):
    network_list = query_all_networks()
    message = f"Updating network {network_id}"
    network = Network.query.get(network_id)
    lh = Peer.query.get(network.lighthouse)
    sudo_password = current_app.config["SUDO_PASSWORD"]
    network.name = request.form.get("name")
    network.proxy = request.form.get("proxy")
    network.lighthouse = request.form.get("lighthouse")
    network.public_key = request.form.get("public_key")
    network.peers_list = request.form.get("peers_list")
    network.base_ip = request.form.get("base_ip")
    network.subnet = request.form.get("subnet")
    network.dns_server = request.form.get("dns")
    network.description = request.form.get("description")
    network.persistent_keepalive = request.form.get("persistent_keepalive")
    network.adapter_name = request.form.get("adapter_name")
    network.allowed_ips = request.form.get("allowed_ips")

    # Add peer to running server
    if current_app.config["MODE"] == "server":
        pass
        message += "\nError updating peer on running server"
    else:
        db.session.commit()
        message += "\nNetwork updated in database"

    print(message)
    flash(message, "success")
    return render_template("networks.html", network_list=network_list)


@networks.route("/delete/<int:network_id>", methods=["POST"])
@login_required
def network_delete(network_id):
    network = Network.query.filter_by(id=network_id).first()
    message = helpers.remove_peers_all(network.id)
    db.session.delete(network)
    db.session.commit()
    message += f"\nNetwork deleted successfully"
    network_list = query_all_networks()
    category = "success"
    return jsonify({"category": category, "message": message})


@networks.route("/activate/<int:network_id>", methods=["POST"])
@login_required
def network_activate(network_id):
    message = f"Activating network {network_id}"
    category = "information"
    if current_app.config["MODE"] == "server":
        if request.form.get("sudoPassword"):
            sudo_password = request.form.get("sudoPassword")
        else:
            sudo_password = current_app.config["SUDO_PASSWORD"]
        network = Network.query.filter_by(id=network_id).first()
        if network.adapter_name in helpers.get_adapter_names():
            message += "Network already active"
            network.active = True
            db.session.commit()
            return jsonify({"category": category, "message": message})
        try:
            helpers.run_sudo("wg-quick up " + network.adapter_name, sudo_password)
        except Exception as e:
            traceback.print_exc()
            category = "danger"
            message += "Error activating network: " + str(e)
        else:
            network.active = True
            db.session.commit()
            category = "success"
            message += "Network activated successfully"
    else:
        category = "warning"
        message = "Cannot activate network in database mode"

    return jsonify({"category": category, "message": message})


@networks.route("/deactivate/<int:network_id>", methods=["POST"])
@login_required
def network_deactivate(network_id):
    message = f"Deactivating network {network_id}"
    category = "information"
    if current_app.config["MODE"] == "server":
        if request.form.get("sudoPassword"):
            sudo_password = request.form.get("sudoPassword")
        else:
            sudo_password = current_app.config["SUDO_PASSWORD"]
        network = Network.query.filter_by(id=network_id).first()
        try:
            helpers.run_sudo("wg-quick down " + network.adapter_name, sudo_password)
        except Exception as e:
            traceback.print_exc()
            message += "Error deactivating network: " + str(e)
            category = "danger"
        else:
            network.active = False
            db.session.commit()
            message += "Network deactivated successfully"
            category = "success"
    else:
        category = "warning"
        message = "Cannot deactivate network in database mode"
    return jsonify({"category": category, "message": message})


@networks.route("/api/<int:network_id>", methods=["POST", "GET", "PATCH", "DELETE"])
@login_required
def network_api(network_id):
    if request.method == "GET":
        if network_id == 0:
            return jsonify([network.to_dict() for network in Network.query.all()])
        return jsonify(Network.query.get(network_id).to_dict())
    elif request.method == "POST":
        return add_network(network_id)
    elif request.method == "PATCH":
        message = f"Updating network {network_id}\n"
        network = Network.query.get(network_id)
        # logic to update network
        # If server
        if current_app.config["MODE"] == "server":
            if update_network(network):
                message += "Network updated on server\n"
            else:
                message += "Error updating network on server\n"
        # If database
        for key, value in request.json.items():
            setattr(network, key, value)
        db.session.commit()
        message += "Network updated in database"
        flash(message, "success")
        return jsonify(network)
    elif request.method == "DELETE":
        message = f"Deleting network {network_id}\n"
        network = Network.query.get(network_id)
        # If server
        if current_app.config["MODE"] == "server":
            if remove_network(network_id):
                message += "Network removed from server\n"
            else:
                message += "Error removing network from server\n"
        # If database
        db.session.delete(network)
        db.session.commit()
        message += "Network removed from database"
        flash(message, "success")
        return jsonify(message)
    else:
        return jsonify("Invalid request method")
    

@networks.route("/api/ip/<int:network_id>", methods=["GET"])
@login_required
def network_ip(network_id):
    ip_dict = helpers.get_available_ip(network_id)
    return jsonify(ip_dict)