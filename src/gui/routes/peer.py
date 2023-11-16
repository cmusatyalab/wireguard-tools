from flask import Blueprint, render_template, request
import json

# Testing wg input
import wireguard_tools as wgt

devices = wgt.WireguardDevice.list()

peers = Blueprint("peers", __name__, url_prefix="/peers")

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


@peers.route("/", methods=["GET", "POST"])
def peers_all():
    if request.method == "POST":
        print("POSTED to peers")
    else:
        return render_template("peers.html", peer_list=peer_list)


@peers.route("/<peer_id>", methods=["GET", "POST"])
def peer_detail(peer_id):
    if request.method == "POST":
        print("POSTED to peers")
    else:
        peer = next((item for item in peer_list if item["id"] == int(peer_id)), None)
        print(f"Found: {peer}")
        return render_template(
            "peer_detail.html",
            peer=peer,
            config=(
                json.dumps(
                    peer["config"], sort_keys=True, indent=4, separators=(",", ": ")
                )
            ),
        )
