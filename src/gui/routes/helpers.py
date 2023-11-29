from flask import current_app
from gui.models import Network, Peer
import os
import psutil
import socket

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
    if network.dns:
        adapter_string += f"DNS = {network.dns}\n"
    network_config_string = network.get_config()
    config_file_string += network_config_string

    return config_file_string

def config_save(config_file_string, filepath) -> 'bool':
    location = filepath.split('/')[-1]
    # Save the adapter configuration file to the output directory
    os.makedirs(f"{current_app.config['OUTPUT_DIR']}/{location}", exist_ok=True)
    try:
        config_file = open(
            f"{current_app.config['OUTPUT_DIR']}/{location}/wg0.conf", "w"
        )
        config_file.write(
            config_file_string
        )
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