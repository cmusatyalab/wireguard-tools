from flask import Blueprint, render_template, request

# Testing wg input
import wireguard_tools as wgt
devices = wgt.WireguardDevice.list()

bp = Blueprint("peers", __name__, url_prefix="/peers")
peer_list = [
    {
        "name": "peer 1",
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
        "network": 1,
        "description": "description 1",
        "id": 1,
    },
]


@bp.route("/", methods=["GET", "POST"])
def peers():
    if request.method == "POST":
        print("POSTED to peers")
    else:
        return render_template("peers.html", peer_list=peer_list)
