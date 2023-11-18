from flask import Blueprint, render_template, request
from gui.models import db, Peer
import json

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


# Dummy list for testing
peer_list = [
    {
        "name": "peer 1",
        "config": {
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
        },
        "network": 1,
        "description": "description 1",
        "id": 1,
    },
    {
        "name": "peer 2",
        "config": {
            "interface": {
                "address": "10.10.10.14/32",
                "listern_port": "51820",
                "private_key": "iISiPlI8UHSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
            },
            "peer": {
                "AllowedIPs": ["0.0.0.0/0", "::/0"],
                "PublicKey": "iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=",
                "PersistentKeepalive": 25,
                "Endpoint": "myserver.dyndns.org:51820",
            },
        },
        "network": 1,
        "description": "description 2",
        "id": 2,
    },
]


# print(peer_list)
def query_all_peers():
    peer_query = Peer.query.all()
    for peer in peer_query:
        peer.public_key = wgt.WireguardKey(
            peer.config["interface"]["private_key"]
        ).public_key()
    print(peer_query)
    return peer_query


@peers.route("/", methods=["GET", "POST" "DELETE", "PUT"])
def peers_all():
    if request.method == "POST":

        message = "Bulk peers added successfully"
        peer_list = query_all_peers()
        return render_template("peers.html", message=message, peer_list=peer_list)

    elif request.method == "GET":
        peer_list = query_all_peers()
        return render_template("peers.html", peer_list=peer_list)
    else:
        message = "Invalid request method"
        return render_template("peers.html", message=message, peer_list=peer_list)


@peers.route("/add", methods=["GET", "POST"])
def peers_add():
    new_peer = {}
    new_peer["config"] = sample_config
    new_peer["public_key"] = ""

    return render_template(
        "peer_detail.html",
        peer=new_peer,
        config=(
            json.dumps(
                new_peer["config"], sort_keys=True, indent=4, separators=(",", ": ")
            )
        ),
        method="'POST'",
        s_button = "Add"
    )


@peers.route("/<peer_id>", methods=["GET", "POST"])
def peer_detail(peer_id):
    if request.method == "POST":
        name = request.form["name"]
        private_key = request.form["private_key"]
        config = request.form["config"]
        network = request.form["network"]
        description = request.form["description"]
        new_peer = Peer(
            name=name,
            private_key=private_key,
            config=config,
            network=network,
            description=description,
        )
        db.session.add(new_peer)
        db.session.commit()
        message = "Peer added successfully"
        peer_list = query_all_peers()
        return render_template("peers.html", message=message, peer_list=peer_list)
    
    elif request.method == "GET":
        # peer = next((item for item in peer_list if item["id"] == int(peer_id)), None)
        peer = Peer.query.filter_by(id=peer_id).first()
        print(f"Found: {peer}")

        return render_template(
            "peer_detail.html",
            peer=peer,
            config=(
                json.dumps(
                    peer["config"], sort_keys=True, indent=4, separators=(",", ": ")
                )
            ),
            s_button = "Update"
        )
    else:
        message = "Invalid request method"
        return render_template("peer_detail.html", peer=peer, message=message)
