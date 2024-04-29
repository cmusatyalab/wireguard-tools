from flask import current_app, flash
from gui.models import db, Network, Peer
from os.path import exists
import subprocess as sp
import os
import ipaddress
import psutil
import socket
import re


def check_wireguard(sudo_password=""):
    if sudo_password == "":
        sudo_password = current_app.config["SUDO_PASSWORD"]
    if not exists("/etc/wireguard"):
        # check if this is a linux machine
        if sp.check_output(["uname", "-s"]).decode("utf-8").strip() == "Linux":
            # Update Repositories
            run_sudo("apt update", sudo_password)
            run_sudo("apt -y full-upgrade", sudo_password)
            # Install Wireguard
            run_sudo("apt -y install wireguard", sudo_password)
            return True
        else:
            print("Currently this only works on Linux machines")
            return False
    else:
        return True


def config_add_peer(config_string: str, peer: Peer) -> str:
    # Add a new peer to the adapter configuration file
    new_config_string = config_string
    new_config_string += f"\n[Peer]\nPublicKey = {peer.public_key}\nAllowedIPs = {peer.allowed_ips}\nEndpoint = {peer.endpoint_host}:{peer.endpoint_port}\n"
    if peer.preshared_key:
        new_config_string += f"PresharedKey = {peer.preshared_key}\n"
    return new_config_string


def config_build(peer: Peer, network: Network) -> str:
    # Create the adapter configuration file
    if peer.lighthouse:
        subnet = str(network.subnet)
        network_config_string = ""
    else:
        subnet = str(peer.subnet)
        network_config_string = network.get_config()
    config_file_string = f"[Interface]\nPrivateKey = {peer.private_key}\nAddress = {peer.address}/{subnet}\nListenPort = {peer.listen_port}\nSaveConfig = true\n"
    if peer.post_down:
        config_file_string += f"PostDown = {peer.post_down}\n"
    if peer.post_up:
        config_file_string += f"PostUp = {peer.post_up}\n"
    if peer.dns:
        config_file_string += f"DNS = {peer.dns}\n\n"
    elif network.dns_server:
        config_file_string += f"DNS = {network.dns_server}\n\n"
    else:
        config_file_string += "\n"
    config_file_string += network_config_string

    return config_file_string


def config_save(config_file_string, directory, filename) -> "bool":
    print(f"Saving config file {filename} to {directory}")
    # Save the adapter configuration file to the output directory
    os.makedirs(f"{current_app.config['OUTPUT_DIR']}/{directory}", exist_ok=True)
    try:
        config_file = open(
            f"{current_app.config['OUTPUT_DIR']}/{directory}/{filename}", "w"
        )
        config_file.write(config_file_string)
    except:
        return False
    return True


def enable_ip_forwarding_v4(sudo_password):
    message = ""
    try:
        run_sudo("sysctl -w net.ipv4.ip_forward=1", sudo_password)
        run_sudo("sysctl -p", sudo_password)
        message += f"\nIPv4 forwarding enabled"
    except Exception as e:
        message += f"\nError enabling ipv4 forwarding: {e}"
    print(message)
    return message


def generate_cert(cert_path, cert_name, key_name):
    # Generate a new certificate for the server
    if not exists(cert_path):
        os.makedirs(cert_path)
    run_cmd(
        "openssl req -nodes -x509 -newkey rsa:4096"
        + f" -keyout {cert_path}/{key_name} -out {cert_path}/{cert_name}"
        + " -subj /O=ClockWorx/CN=wireguard-gui"
    )


def get_adapter_names():
    # Get a list of all the adapters on the machine
    adapters = psutil.net_if_addrs()
    adapter_names = []
    for adapter in adapters:
        if adapter != "lo":
            adapter_names.append(adapter)
 
    return adapter_names

def get_available_ip(network_id: int = 0) -> dict:
    if network_id == 0:
        network = get_network(network_id)
        network.base_ip = current_app.config["BASE_IP"]
        network.subnet = current_app.config["BASE_NETMASK"]
    else:
        network = get_network(network_id)
    ip_dict = {}
    if network.base_ip == "":
        base_ip = current_app.config["BASE_IP"]
    else:
        base_ip = network.base_ip
    if network.subnet == 0:
        subnet = current_app.config["BASE_NETMASK"]
    else:
        subnet = network.subnet

    # Add all ip addresses in the base IP /subnet range to the dictionary
    for ip in ipaddress.IPv4Network(f"{base_ip}/{subnet}"):
        # Skip .0 and .255
        if str(ip).split('.')[3] == '0' or str(ip).split('.')[3] == "255":
            pass
        else:
            ip_dict[str(ip)] = None

    if network.peers_list is None:
        pass
    else:
        for peer in network.peers_list:
            # add the peer name to the peer IP in the dictionary
            ip_dict[peer.network_ip] = peer.name

    return ip_dict        

def get_lighthouses():
    return Peer.query.filter_by(lighthouse=True).all()


def get_network(network_id: int) -> Network:
    network = Network()
    message = f"Network Lookup using {network_id} which is {type(network_id)}"
    try:
        network = Network.query.get(network_id)
        message += f"\nfound {network.name}"
    except:
        message += f"\nNetwork {network_id} not found"
        message += f"\nUsing Invalid Network settings"
        network = Network(
            name="Invalid Network",
            lighthouse=[],
            private_key="",
            peers_list=[],
            base_ip="0.0.0.0",
            subnet=0,
            dns_server="",
            description="Invalid Network placeholder",
            allowed_ips="",
            adapter_name="",
        )
    print(message)
    return network

def get_peer_count(network_id: int) -> int:
    count = 0
    with db.session.no_autoflush:
        network = Network.query.get(network_id)
        if network.peers_list is None:
            pass
        else:
            count = len(network.peers_list)
        # Add any lighthouses to the peer count as well
        count += len(network.lighthouse)
    print(f"Peer count {count}")
    return count

def get_peers_status(network_adapter="all", sudo_password=""):
    output = ""
    if current_app.config["LINUX"]:
        output = run_sudo(f"wg show {network_adapter}", sudo_password)
    else:
        # TODO: Implement Windows sudo
        output = ""
        #flash("Command line options not implemented for Windows", "warning")
    return parse_wg_output(output)



def get_public_ip():
    try:
        # Connect to a known server
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def parse_wg_output(output):
    output_lines = output.split("\n")
    peers_data = {}
    current_peer = None

    for line in output_lines:
        peer_match = re.match(r"\s*peer: (\S+)", line)
        endpoint_match = re.match(r"\s*endpoint: (\S+):(\d+)", line)
        allowed_ips_match = re.match(r"\s*allowed ips: (\S+)", line)
        transfer_match = re.match(r"\s*transfer: (\S+)", line)
        handshake_match = re.match(r"\s*latest handshake: (.+ ago)", line)

        if peer_match:
            current_peer = peer_match.group(1)
            peers_data[current_peer] = {}
        elif endpoint_match and current_peer:
            peers_data[current_peer]["endpoint"] = endpoint_match.group(1)
            peers_data[current_peer]["endpoint_port"] = endpoint_match.group(2)
        elif allowed_ips_match and current_peer:
            peers_data[current_peer]["allowed_ips"] = allowed_ips_match.group(1)
        elif transfer_match and current_peer:
            transfer_data = transfer_match.group(1).split("/")
            if len(transfer_data) >= 2:
                peers_data[current_peer]["transfer_rx"] = transfer_data[0]
                peers_data[current_peer]["transfer_tx"] = transfer_data[1]
        elif handshake_match and current_peer:
            time_str = handshake_match.group(1)
            time_lst = time_str[:-4].split(", ")
            days, hours, minutes, seconds = 0, 0, 0, 0
            for element in time_lst:
                if "day" in element:
                    days = int(element.split()[0])
                elif "hour" in element:
                    hours = int(element.split()[0])
                elif "minute" in element:
                    minutes = int(element.split()[0])
                elif "second" in element:
                    seconds = int(element.split()[0])
            total_seconds = days * 86400 + hours * 3600 + minutes * 60 + seconds
            print(f"{current_peer} - time: {total_seconds}")
            peers_data[current_peer]["latest_handshake"] = total_seconds

    return peers_data


def port_open(port: int):
    # Check if the port is open
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(("8.8.8.8", port))
    if result == 0:
        return True
    else:
        return False


def remove_peers_all(network_id: int, sudo_password=""):
    message = f"Removing peers from network {network_id}"
    if sudo_password == "":
        sudo_password = current_app.config["SUDO_PASSWORD"]
    network = get_network(network_id)
    message += f"\n\tNetwork {network.name} found"
    peers = Peer.query.filter_by(network=network.id).all()
    for peer in peers:
        run_sudo(
            f"wg set {network.adapter_name} peer {str(peer.get_public_key())} remove",
            sudo_password,
        )
        message += f"\n\t\tRemoved peer {peer.name} from adapter {network.adapter_name}"
        peer.active = False
        peer.network = 0
        db.session.commit()
        message += f"\n\t\tUnregistered peer {peer.name} from network"
    return message


def run_cmd(command) -> str:
    print(f"Running {command}")
    cmd_lst = command.split()
    result = sp.run(cmd_lst, stderr=sp.PIPE, stdout=sp.PIPE)
    output = result.stdout.decode()
    error = result.stderr.decode()
    if error != "":
        print(f"\n\n\tError:\n{error}")
    print(f"\n\n\tOutput:\n{output}")
    return output


def run_sudo(command: str, password: str) -> str:
    output = ""
    if current_app.config["LINUX"]:
        print(f"Running {command} with sudo")
        cmd_lst = ["sudo", "-S"] + command.split()
        result = sp.run(
            cmd_lst, input=password.encode(), stderr=sp.PIPE, stdout=sp.PIPE
        )
        output = result.stdout.decode()
        error = result.stderr.decode()
        if error != "":
            print(f"\n\n\tSudo Error:\n{error}")
        print(f"\n\n\tSudo Output:\n{output}")
    else:
        # TODO: Implement Windows sudo
        output = "Command line options not implemented for Windows"
        #flash("Sudo command line options not implemented for Windows", "warning")
    return output
