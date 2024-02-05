from .database import db
from .config import Config, config_schema, configs_schema, config_load_test_db
from .network import Network, network_schema, networks_schema, network_load_test_db
from .peer import Peer, peer_load_test_db
from .user import User, user_schema, users_schema, user_load_test_db
import ipaddress

subnets = []

for i in range(32, 15, -1):
    net = ipaddress.ip_network(f"0.0.0.0/{i}")
    subnets.append(
        {"CIDR": i, "clients": net.num_addresses, "mask": net.netmask.compressed}
    )

if __name__ == "__main__":
    print(subnets)
