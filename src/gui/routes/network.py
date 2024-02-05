import traceback
from flask import Blueprint, current_app, flash, render_template, request
from flask_login import login_required
from gui.models import db, Network, subnets
from gui.routes import helpers
import json

networks = Blueprint("networks", __name__, url_prefix="/networks")


## FUNCTIONS ##
def query_all_networks():
    network_query = Network.query.all()
    # TODO: create a more robust error handling system
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
            network.lh_ip = request.form.get("lh_ip")
            network.peers = request.form.get("peers")
            network.base_ip = request.form.get("base_ip")
            network.description = request.form.get("description")
            network.config = request.form.get("config")
            network.adapter_name = request.form.get("adapter_name")
            network.lighthouse = request.form.get("lighthouse")
        if network.adapter_name == "":
            network.adapter_name = "wg0"

        db.session.commit()
        message = "Network updated successfully"
        network_list = query_all_networks()
        flash(message, "success")
        return render_template("networks.html", network_list=network_list)

    elif request.method == "GET":
        return render_template(
            "network_detail.html",
            subnets=subnets,
            network=network,
            lighthouses = helpers.get_lighthouses(),
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
    new_network = {}
    new_network["public_key"] = ""
    new_network["name"] = 1
    lighthouses = helpers.get_lighthouses()
    adapters = helpers.get_adapter_names()
    if request.method == "POST":
        name = request.form.get("name")
        # lighthouse is the object in lighthouses with the id from request.form.get("lighthouse")
        lighthouse = next(
            (item for item in lighthouses if item.id == int(request.form.get("lighthouse"))),
            None,
        )
        
        lh_ip = lighthouse.endpoint_host
        lh_port = lighthouse.listen_port
        public_key = lighthouse.get_public_key()
        base_ip = request.form.get("base_ip")
        subnet = request.form.get("subnet")
        dns = request.form.get("dns")
        description = request.form.get("description")
        allowed_ips = request.form.get("allowed_ips")
        config = request.form.get("config")
        adapter_name = request.form.get("adapter_name")

        # Create a new network object
        # TODO: fix config name rotation
        new_network = Network(
            name=name,
            proxy=False,
            lighthouse=lighthouse.id,
            adapter_name=adapter_name,
            public_key=public_key,
            peers_list="",
            base_ip=base_ip,
            subnet=subnet,
            dns_server=dns,
            description=description,
            allowed_ips=allowed_ips,
            config=json.dumps(
                {
                    "public_key": public_key,
                    "endpoint_host": lh_ip,
                    "endpoint_port": lh_port,
                    "preshared_key": None,
                    "persistent_keepalive": current_app.config["BASE_KEEPALIVE"],
                    "allowed_ips": allowed_ips,
                }
            ),
        )
        if request.form.get('adapter_name'):
            new_network.adapter_name = request.form.get('adapter_name')
        db.session.add(new_network)
        db.session.commit()
        message = "Network added successfully"
        network_list = query_all_networks()
        flash(message, "success")
        return render_template("networks.html",  networks=network_list)
    else:
        return render_template(
            "network_detail.html",
            network=new_network,
            subnets=subnets,
            lighthouses=lighthouses,
            adapters=adapters,
            s_button="Add",
        )


@networks.route("/delete/<int:network_id>", methods=["POST"])
@login_required
def network_delete(network_id):
    network = Network.query.filter_by(id=network_id).first()
    message = helpers.remove_peers_all(network.id)
    db.session.delete(network)
    db.session.commit()
    message += f"\nNetwork deleted successfully"
    network_list = query_all_networks()
    flash(message, "success")
    return render_template("networks.html", networks=network_list)


@networks.route("/activate/<int:network_id>", methods=["POST"])
@login_required
def network_activate(network_id):
    message = f"Activating network {network_id}"
    sudo_password = request.form.get("sudoPassword")
    network = Network.query.filter_by(id=network_id).first()
    if network.adapter_name in helpers.get_adapter_names():
        message += "Network already active"
        network.active = True
        db.session.commit()
        network_list = query_all_networks()
        flash(message, "info")
        return render_template("networks.html", networks=network_list)
    try:
        helpers.run_sudo("wg-quick up " + network.adapter_name, sudo_password)
    except Exception as e:
        traceback.print_exc()
        message += "Error activating network: " + str(e)
        flash(message, "danger")
    else:
        network.active = True
        db.session.commit()
        message += "Network activated successfully"
        flash(message, "success")
    finally:
        network_list = query_all_networks()
        return render_template("networks.html", message=message, networks=network_list)


@networks.route("/deactivate/<int:network_id>", methods=["POST"])
@login_required
def network_deactivate(network_id):
    message = f"Deactivating network {network_id}"
    sudo_password = request.form.get("sudoPassword")
    network = Network.query.filter_by(id=network_id).first()
    try:
        helpers.run_sudo("wg-quick down " + network.adapter_name, sudo_password)
    except Exception as e:
        traceback.print_exc()
        message += "Error deactivating network: " + str(e)
        flash(message, "danger")
    else:
        network.active = False
        db.session.commit()
        message += "Network deactivated successfully"
        flash(message, "success")
    finally:
        network_list = query_all_networks()
        return render_template("networks.html", networks=network_list)
