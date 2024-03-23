from flask import (
    Blueprint,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import login_required
from gui.models import db, Peer, Network
from gui.routes import helpers


# Testing wg input
import wireguard_tools as wgt

devices = wgt.WireguardDevice.list()

peers = Blueprint("peers", __name__, url_prefix="/peers")


sample_config = {
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

## FUNCTIONS ##


def add_peer(peer, network, sudo_password):
    # Add a new peer to the running server
    peer_cmd = f"wg set {network.adapter_name} peer {peer.get_public_key()} allowed-ips {peer.address}/{peer.subnet}"
    print(f"Add Peer: {peer_cmd}")
    try:
        helpers.run_sudo(peer_cmd, sudo_password)
    except Exception as e:
        print(e)
        return False
    else:
        return True


def query_all_peers(network_id=None):
    if network_id is not None:
        peer_query = Peer.query.filter_by(network=network_id).all()
        print(f"Network {network_id} has {len(peer_query)} peers")
    else:
        peer_query = Peer.query.all()
        print(f"Found {len(peer_query)} peers")
    for peer in peer_query:
        peer.public_key = wgt.WireguardKey(peer.private_key).public_key()
        network = helpers.get_network(peer.network)
        print(f"Peer {peer.name} is on network {network.name}")
        if network.name == "Invalid Network placeholder":
            print(f"Skipping {peer.name} on {network.name}")
            continue
        current_peers = helpers.get_peers_status(network.adapter_name)
        for key in current_peers.keys():
            print(f"Checking {key}")
            if str(peer.public_key) == str(key):
                print(f"Found {peer.public_key}")
                if "latest_handshake" in current_peers[str(peer.public_key)]:
                    if int(
                        current_peers[str(peer.public_key)]["latest_handshake"]
                    ) <= int(current_app.config["PEER_ACTIVITY_TIMEOUT"]):
                        print(f"Peer {peer.public_key} is active")
                        peer.active = True
                    else:
                        peer.active = False
                else:
                    print(f"No handshake not found for {peer.public_key}")
                    peer.active = False
    return peer_query


def query_all_networks():
    network_query = Network.query.all()
    return network_query


def remove_peer(peer, network, sudo_password):
    # Remove a peer from the running server
    peer_cmd = f"wg set {network.adapter_name} peer {peer.get_public_key()} remove"
    print(f"Remove Peer: {peer_cmd}")
    try:
        helpers.run_sudo(peer_cmd, sudo_password)
    except Exception as e:
        print(e)
        return False
    else:
        return True
    
def update_peer(peer):
    # Update a peer on the running server
    return False


## ROUTES ##


@peers.route("/", methods=["GET", "POST"])
@login_required
def peers_all():
    if request.method == "POST":
        message = "Bulk peers added successfully"
        peer_list = query_all_peers()
        flash(message, "success")
        return render_template("peers.html", peer_list=peer_list)
    elif request.method == "GET":
        network_id = request.args.get("network_id")
        peer_list = query_all_peers(network_id)
        return render_template("peers.html", peer_list=peer_list)
    else:
        message = "Invalid request method"
        peer_list = query_all_peers()
        flash(message, "warning")
        return render_template("peers.html", peer_list=peer_list)


@peers.route("/add", methods=["GET", "POST"])
@login_required
def peers_add():
    message = "Adding new peer"
    network_list = query_all_networks()
    new_peer = {}
    new_peer["id"] = 0
    new_peer["config"] = sample_config
    new_peer["public_key"] = ""
    new_peer["network"] = 1
    if request.method == "POST":
        name = request.form.get("name")
        description = request.form.get("description")
        private_key = request.form.get("private_key")
        if request.form.get("lighthouse") == "on":
            lighthouse = True
        else:
            lighthouse = False
        if request.form.get("listen_port"):
            listen_port = request.form.get("listen_port")
        else:
            listen_port = 51820
        network_ip = request.form.get("network_ip")
        subnet = request.form.get("subnet")
        dns = request.form.get("dns")
        # peer_config = request.form["peer_config"]
        if request.form.get("network"):
            network = Network.query.get(request.form.get("network"))
        else:
            if Network.query.get(1) is None:
                network = Network(id=0, name="Invalid Network placeholder")
            else:
                network = Network.query.get(1)
        if request.form.get("sudoPassword"):
            sudo_password = request.form.get("sudoPassword")
        else:
            sudo_password = current_app.config["SUDO_PASSWORD"]

        new_peer = Peer(
            name=name,
            private_key=private_key,
            network_ip=network_ip,
            subnet=subnet,
            listen_port=listen_port,
            lighthouse=lighthouse,
            dns=dns,
            # peer_config=peer_config,
            network=network.id,
            description=description,
        )
        if request.form.get("endpoint_ip"):
            new_peer.endpoint_host = request.form.get("endpoint_host")
        db.session.add(new_peer)
        db.session.commit()
        message += "\nPeer added to database"
        # Add peer to running server
        if current_app.config["MODE"] == "server" and network.id > 0:
            if add_peer(new_peer, network, sudo_password):
                message += "\nPeer added to running server"
            else:
                message += ", but failed to add to running server"
            
        print(message)
        flash(message.replace('\n','<br>'), "success")
        return redirect(url_for("peers.peer_detail", peer_id=new_peer.id))
    else:
        return render_template(
            "peer_detail.html",
            networks=network_list,
            peer=new_peer,
            s_button="Add",
        )


@peers.route("/update/<int:peer_id>", methods=["POST"])
@login_required
def peer_update(peer_id):
    message = f"Updating peer {peer_id}"
    peer = Peer.query.get(peer_id)
    network = Network.query.get(peer.network)
    sudo_password = current_app.config["SUDO_PASSWORD"]
    peer.name = request.form.get("name")
    peer.description = request.form.get("description")
    peer.private_key = request.form.get("private_key")
    peer.network_ip = request.form.get("network_ip")
    peer.endpoint_host = request.form.get("endpoint_ip")
    peer.listen_port = request.form.get("listen_port")
    peer.subnet = request.form.get("subnet")
    if request.form.get("listen_port"):
        peer.listen_port = request.form.get("listen_port")
    peer.dns = request.form.get("dns")
    peer.network = request.form.get("network")
    if request.form.get("lighthouse") == "on":
        peer.lighthouse = True
    else:
        peer.lighthouse = False
    print(f"Lighthouse: {peer.lighthouse}")
    # Add peer to running server
    if current_app.config["MODE"] == "server":
        pass
        message += "\nError updating peer on running server"
    else:
        db.session.commit()
        message += "\nPeer updated in database"
    peer_list = query_all_peers()
    print(message)
    flash(message, "success")
    return render_template("peers.html", peer_list=peer_list)


@peers.route("/delete/<int:peer_id>", methods=["POST"])
@login_required
def peer_delete(peer_id):
    message = f"Deleting peer {peer_id}"
    peer = Peer.query.filter_by(id=peer_id).first()
    network = helpers.get_network(peer.network)
    sudo_password = current_app.config["SUDO_PASSWORD"]
    # Remove peer from running server
    if current_app.config["MODE"] == "server":
        if remove_peer(peer, network, sudo_password):
            db.session.delete(peer)
            db.session.commit()
            message += "\nPeer deleted successfully"
            flash(message, "success")
        else:
            message += "\nError removing peer from running server"
            flash(message, "danger")
    else:
        db.session.delete(peer)
        db.session.commit()
        message += "\nPeer deleted successfully"
        flash(message, "success")
    peer_list = query_all_peers()
    print(message)

    return render_template("peers.html", peer_list=peer_list)


@peers.route("/<int:peer_id>", methods=["GET"])
@login_required
def peer_detail(peer_id):
    # peer = next((item for item in peer_list if item["id"] == int(peer_id)), None)
    peer = Peer.query.filter_by(id=peer_id).first()
    print(f"Found: {peer}")

    return render_template(
        "peer_detail.html",
        networks=query_all_networks(),
        peer=peer,
        s_button="Update",
    )

@peers.route("/api/<int:peer_id>", methods=["POST","GET", "PATCH", "DELETE"])
@login_required
def peer_api(peer_id):
    if request.method == "GET":
        if peer_id == 0:
            return jsonify([peer.to_dict() for peer in Peer.query.all()])
        return jsonify(Peer.query.get(peer_id))
    elif request.method == "POST":
        return add_peer(peer_id)
    elif request.method == "PATCH":
        message = f"Updating peer {peer_id}\n"
        peer = Peer.query.get(peer_id)
        # logic to update peer
        # If server
        if current_app.config["MODE"] == "server":
            if update_peer(peer):
                message += "Peer updated on server\n"
            else:
                message += "Error updating peer on server\n"
        # If database
        for key, value in request.json.items():
            setattr(peer, key, value)
        db.session.commit()
        message += "Peer updated in database"
        flash(message, "success")
        return jsonify(peer)
    elif request.method == "DELETE":
        message = f"Deleting peer {peer_id}\n"
        peer = Peer.query.get(peer_id)
        # If server
        if current_app.config["MODE"] == "server":
            if remove_peer(peer_id):
                message += "Peer removed from server\n"
            else:
                message += "Error removing peer from server\n"
        # If database
        db.session.delete(peer)
        db.session.commit()
        message += "Peer removed from database"
        flash(message, "success")
        return jsonify(message)
    else:
        return jsonify("Invalid request method")
    
@peers.route("/activate/<int:peer_id>", methods=["POST"])
@login_required
def peer_activate(peer_id):
    message = f"Activating peer {peer_id}\n"
    category = "information"
    if current_app.config["MODE"] == "server":
        peer = Peer.query.get(peer_id)
        network = Network.query.get(peer.network)
        sudo_password = current_app.config["SUDO_PASSWORD"]
        # Add peer to running server
        if current_app.config["MODE"] == "server":
            if add_peer(peer, network, sudo_password):
                message += "Peer added to running server"
            else:
                message += "Error adding peer to running server"
        else:
            peer.active = True
            db.session.commit()
            message += "Peer activated in database"
    else:
        message = "Peer activation only available on server"
        category = "warning"
    return jsonify({"category":category, "message":message})