from flask import (
    Blueprint,
    current_app,
    render_template,
    request,
)
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
        network = Network.query.filter_by(id=peer.network).first()
        print(f"Peer {peer.name} is on network {network.adapter_name}")
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


## ROUTES ##


@peers.route("/", methods=["GET", "POST"])
def peers_all():
    if request.method == "POST":
        message = "Bulk peers added successfully"
        peer_list = query_all_peers()
        return render_template("peers.html", message=message, peer_list=peer_list)
    elif request.method == "GET":
        network_id = request.args.get("network_id")
        peer_list = query_all_peers(network_id)
        return render_template("peers.html", peer_list=peer_list)
    else:
        message = "Invalid request method"
        return render_template("peers.html", message=message, peer_list=peer_list)


@peers.route("/add", methods=["GET", "POST"])
def peers_add():
    message = "Adding new peer"
    network_list = query_all_networks()
    new_peer = {}
    new_peer["config"] = sample_config
    new_peer["public_key"] = ""
    new_peer["network"] = 1
    if request.method == "POST":
        name = request.form["name"]
        description = request.form["description"]
        private_key = request.form["private_key"]
        address = request.form["address"]
        dns = request.form["dns"]
        # peer_config = request.form["peer_config"]
        network = Network.query.filter_by(id=request.form["network"]).first()
        if request.form.get("sudoPassword"):
            sudo_password = request.form.get("sudoPassword")
        else:
            sudo_password = current_app.config["SUDO_PASSWORD"]

        new_peer = Peer(
            name=name,
            private_key=private_key,
            address=address,
            dns=dns,
            # peer_config=peer_config,
            network=network.id,
            description=description,
        )
        db.session.add(new_peer)
        db.session.commit()
        # Add peer to running server
        if add_peer(new_peer, network, sudo_password):
            message += "\nPeer added successfully"
        else:
            message += "\nPeer added successfully, but failed to add to running server"
        peer_list = query_all_peers()
        print(message)
        return render_template("peers.html", message=message, peer_list=peer_list)
    else:
        return render_template(
            "peer_detail.html",
            networks=network_list,
            peer=new_peer,
            s_button="Add",
        )


@peers.route("/delete/<int:peer_id>", methods=["POST"])
def peer_delete(peer_id):
    message = f"Deleting peer {peer_id}"
    peer = Peer.query.filter_by(id=peer_id).first()
    network = Network.query.filter_by(id=peer.network).first()
    if request.form.get("sudoPassword"):
        sudo_password = request.form.get("sudoPassword")
    else:
        sudo_password = current_app.config["SUDO_PASSWORD"]
    # Add peer to running server
    if remove_peer(peer, network, sudo_password):
        db.session.delete(peer)
        db.session.commit()
        message += "\nPeer deleted successfully"
    else:
        message += "\nError removing peer from running server"
    peer_list = query_all_peers()
    print(message)
    return render_template("peers.html", message=message, peer_list=peer_list)


@peers.route("/<int:peer_id>", methods=["GET", "POST"])
def peer_detail(peer_id):
    # peer = next((item for item in peer_list if item["id"] == int(peer_id)), None)
    peer = Peer.query.filter_by(id=peer_id).first()
    print(f"Found: {peer}")

    if request.method == "POST":
        peer.name = request.form["name"]
        peer.description = request.form["description"]
        peer.private_key = request.form["private_key"]
        peer.address = request.form["address"]
        peer.dns = request.form["dns"]
        # peer_config = request.form["peer_config"]
        peer.network = request.form["network"]
        print(f"Peer network ID {peer.network}")

        db.session.commit()
        message = "Peer updated successfully"
        peer_list = query_all_peers()
        return render_template("peers.html", message=message, peer_list=peer_list)

    elif request.method == "GET":
        return render_template(
            "peer_detail.html",
            networks=query_all_networks(),
            peer=peer,
            s_button="Update",
        )
    else:
        message = "Invalid request method"
        return render_template("peer_detail.html", peer=peer, message=message)
