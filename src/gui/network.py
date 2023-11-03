from flask import Blueprint, render_template

bp = Blueprint("networks", __name__, url_prefix="/networks")
# For testing purposes
network_list = [
    {"name": "network 1", "address": "10.10.10.0", "description": "description 1", "id": 1},
    {"name": "network 2", "address": "172.122.88.4", "description": "description 2", "id": 2},
    {"name": "network 3", "address": "192.168.88.0", "description": "description 3", "id": 3}
]


@bp.route("/")
def networks():
    return render_template("networks.html", network_list=network_list)
