import json
import socket
from flask import Blueprint, current_app, render_template, redirect, url_for, request
from ..models import db, Config, Network, Peer, subnets
from wireguard_tools.wireguard_key import WireguardKey
import ipaddress

wizard = Blueprint("wizard", __name__, url_prefix="/wizard")


## ROUTES ##
@wizard.route("/setup", methods=["GET"])
def setup():
    defaults = {
        "base_ip": current_app.config["BASE_IP"],
        "base_port": current_app.config["BASE_PORT"],
        "dns": current_app.config["BASE_DNS"],
    }
    return render_template("wizard_setup.html", defaults=defaults, subnets=subnets)


@wizard.route("/basic", methods=["POST"])
def wizard_basic():
    print(request.form)
    # Get the form data
    name = request.form["name"]
    description = request.form["description"]
    base_ip = request.form["base_ip"]
    subnet = request.form["subnet"]
    dns = current_app.config["BASE_DNS"]

    defaults = {
        "base_ip": current_app.config["BASE_IP"],
        "base_port": current_app.config["BASE_PORT"],
        "dns": current_app.config["BASE_DNS"],
    }

    # Test inputs
    if not name:
        message = "Please enter a name for the network"
        return render_template(
            "wizard_setup.html", defaults=defaults, subnets=subnets, message=message
        )
    defaults["name"] = name
    # test base_ip string to make sure it is a valid IP address
    try:
        ipaddress.ip_address(base_ip)
    except ValueError:
        message = "Please enter a valid IP address"
        return render_template(
            "wizard_setup.html", defaults=defaults, subnets=subnets, message=message
        )
    defaults["base_ip"] = base_ip
    # test subnet to make sure it is a valid subnet
    if int(subnet) not in range(0, 33):
        message = "Please enter a valid subnet"
        return render_template(
            "wizard_setup.html", defaults=defaults, subnets=subnets, message=message
        )
    listen_port = defaults.base_port

    # Append CIDR subnet to base_ip
    print(subnets)
    allowed_ips = base_ip + "/" + str(subnet)
    print(allowed_ips)

    # Get the IP address of the current machine
    endpoint_host = get_public_ip()

    # Create a private key for the lighthouse
    new_key = WireguardKey.generate()
    private_key = str(new_key)
    public_key = str(new_key.public_key())

    # Build peer config
    peer_config = "[Peer]\n"

    # Create a new network object
    new_network = Network(
        name=name,
        lighthouse="",
        lh_ip=get_public_ip(),
        public_key="public_key 1",
        peers_list="",
        base_ip=allowed_ips,
        description=description,
        config=json.dumps(
            {
                "public_key": public_key,
                "preshared_key": None,
                "endpoint_host": endpoint_host,
                "endpoint_port": listen_port,
                "persistent_keepalive": current_app.config["BASE_KEEPALIVE"],
                "allowed_ips": allowed_ips,
            }
        ),
    )

    # Add the new network to the database
    db.session.add(new_network)
    db.session.commit()

    # Create a new peer object
    lh_address = Network.append_ip(base_ip, 1)+"/32"
    new_peer = Peer(
        name=f"Server for {name}",
        private_key=private_key,
        address=lh_address,
        listen_port=listen_port,
        network=new_network.id,
        description="Auto-generated peer for the lighthouse",
    )
    if dns:
        new_peer.dns = dns

    # Add the new peer to the database
    db.session.add(new_peer)
    db.session.commit()

    # Create the adapter configuration file
    adapter_string = (
        "[Interface]\nPrivateKey = {private_key}\nAddress = {lh_address}\nListenPort = {listen_port}\n"

    )

    # Redirect to the peers page
    return redirect(url_for("networks.networks_all"))


## FUNCTIONS ##
def get_public_ip():
    try:
        # Connect to a random server
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip
