import ipaddress
import json
import os
from . import helpers
from flask import Blueprint, current_app, render_template, redirect, url_for, request
from ..models import db, Config, Network, Peer, subnets
from wireguard_tools.wireguard_key import WireguardKey


wizard = Blueprint("wizard", __name__, url_prefix="/wizard")

basedir = os.path.abspath(os.path.dirname(__file__))

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
    # print(request.form)
    # Get the form data
    message = ""
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
    listen_port = defaults["base_port"]

    # Append CIDR subnet to base_ip
    allowed_ips = base_ip + "/" + str(subnet)

    # Get the IP address of the current machine
    endpoint_host = helpers.get_public_ip()

    # Create a private key for the lighthouse
    new_key = WireguardKey.generate()
    private_key = str(new_key)
    public_key = str(new_key.public_key())

    # Create a new network object
    new_network = Network(
        name=name,
        proxy=False,
        lh_ip=endpoint_host,
        public_key=public_key,
        peers_list="",
        base_ip=base_ip,
        subnet=subnet,
        dns_server=dns,
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
    # The lighthouse is always the first peer in the network
    lh_address = Network.append_ip(base_ip, 1) + "/32"

    # Get adapter names for the machine
    adapters = helpers.get_adapter_names()
    print(f"Adapters found:{adapters}")

    post_up_string = f"iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o {adapters[0]} -j MASQUERADE"
    post_down_string = f"iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o {adapters[0]} -j MASQUERADE"
    new_peer = Peer(
        name=f"Server for {name}",
        private_key=private_key,
        address=lh_address,
        listen_port=listen_port,
        post_up=post_up_string,
        post_down=post_down_string,
        network=new_network.id,
        description="Auto-generated peer for the lighthouse",
    )
    if dns:
        new_peer.dns = dns

    # Add the new peer to the database
    db.session.add(new_peer)
    db.session.commit()

    # Create the adapter configuration file
    adapter_string = helpers.config_build(new_peer, new_network)

    if helpers.config_save(adapter_string, "server/wg0.conf"):
        message += "Network created successfully"
    else:
        message += "Error creating network"
    networks = Network.query.all()
    
    # check if wireguard is installed
    if helpers.check_wireguard():
        try:
            helpers.run_sudo(f"cp {basedir}/server/wg0.conf /etc/wireguard/wg0.conf")
            message += "\nConfiguration file copied to /etc/wireguard/wg0.conf"
        except:
            message += "\nError copying configuration file to /etc/wireguard/wg0.conf"
    else:
        message += "\nWireguard is not installed on this machine"
        
    return render_template("networks.html", networks=networks, message=message)