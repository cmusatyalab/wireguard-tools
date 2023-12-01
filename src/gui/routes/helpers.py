from flask import current_app
from gui.models import Network, Peer
from os.path import exists
import subprocess as sp
import os
import psutil
import socket


def check_wireguard(sudo_password: str):
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
    config_file_string = f"[Interface]\nPrivateKey = {peer.private_key}\nAddress = {peer.address}\nListenPort = {peer.listen_port}\nSaveConfig = true\n"
    if peer.post_down:
        config_file_string += f"PostDown = {peer.post_down}\n"
    if peer.post_up:
        config_file_string += f"PostUp = {peer.post_up}\n"
    if peer.dns:
        config_file_string += f"DNS = {peer.dns}\n"
    elif network.dns_server:
        adapter_string += f"DNS = {network.dns_server}\n"
    network_config_string = network.get_config()
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


def get_adapter_names():
    # Get a list of all the adapters on the machine
    adapters = psutil.net_if_addrs()
    adapter_names = []
    for adapter in adapters:
        if adapter != "lo":
            adapter_names.append(adapter)

    return adapter_names


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

def run_cmd(command) -> str:
    print(f"Running {command}")
    cmd_lst = command.split()
    result = sp.run(cmd_lst, stdout=sp.PIPE, stderr=sp.PIPE)
    output = result.stdout.decode()
    error = result.stderr.decode()
    if error:
        print(f"{command} Error: {error}")
    print(f"{command} output: {output}")
    return output

def run_sudo(command: str, password: str) -> str:
    print(f"Running {command} with sudo")
    cmd_lst = ['sudo', '-S'] + command.split()
    result = sp.run(cmd_lst, input=password.encode(), stdout=sp.PIPE, stderr=sp.PIPE)
    output = result.stdout.decode()
    error = result.stderr.decode()
    if error:
        print(f"{command} Error: {error}")
    print(f"{command} output: {output}")
    return output
