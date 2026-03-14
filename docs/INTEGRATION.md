# Developer Integration Guide

This guide covers using `wireguard-tools` as a Python library. For CLI usage,
see the [README](../README.md). For daemon setup, see [DAEMON.md](DAEMON.md).

## Installation

```bash
pip install wireguard-tools
```

Dependencies are minimal: `attrs`, `pyroute2`, and `segno` (for QR codes).

## Quick Start

### Key Generation and Derivation

```python
from wireguard_tools import WireguardKey

private_key = WireguardKey.generate()
public_key = private_key.public_key()

print(f"Private: {private_key}")
print(f"Public:  {public_key}")
print(f"Hex:     {public_key.hex()}")
print(f"URLsafe: {public_key.urlsafe}")
```

Parse an existing key from any encoding:

```python
key = WireguardKey("YpdTsMtb/QCdYKzHlzKkLcLzEbdTK0vP4ILmdcIvnhc=")  # base64
key = WireguardKey("6297d3b0cb5bfd009d60acc79732a42dc2f311b7532b4bcfe082e675c22f9e17")  # hex
```

### Configuration Files

**Parse a `.conf` file:**

```python
from wireguard_tools import WireguardConfig

with open("/etc/wireguard/wg0.conf") as fh:
    config = WireguardConfig.from_wgconfig(fh)

print(f"Listen port: {config.listen_port}")
print(f"Peers: {len(config.peers)}")

for key, peer in config.peers.items():
    print(f"  {peer.friendly_name or key}: {peer.allowed_ips}")
```

**Create a config programmatically:**

```python
from wireguard_tools import WireguardConfig, WireguardKey

private = WireguardKey.generate()
peer_pub = WireguardKey("YpdTsMtb/QCdYKzHlzKkLcLzEbdTK0vP4ILmdcIvnhc=")

config = WireguardConfig.from_dict(dict(
    private_key=str(private),
    listen_port=51820,
    addresses=["10.0.0.1/24"],
    peers=[dict(
        public_key=str(peer_pub),
        allowed_ips=["10.0.0.2/32"],
        endpoint_host="203.0.113.1",
        endpoint_port=51820,
        persistent_keepalive=25,
    )],
))
```

**Serialize:**

```python
# To wg-quick format (includes Address, DNS, Table, etc.)
text = config.to_wgconfig(wgquick_format=True)

# To plain WireGuard format (keys and peers only)
text = config.to_wgconfig(wgquick_format=False)

# To dict (for JSON/YAML serialization)
d = config.asdict()

# To QR code
qr = config.to_qrcode()
qr.save("peer-config.png")
```

### Device Operations

Query and configure running WireGuard interfaces. Requires root.

```python
from wireguard_tools import WireguardDevice

# List all WireGuard interfaces
for device in WireguardDevice.list():
    print(device.interface)

# Get a specific device
device = WireguardDevice.get("wg0")

# Read current configuration (includes runtime stats)
config = device.get_config()
for key, peer in config.peers.items():
    print(f"{key}: rx={peer.rx_bytes} tx={peer.tx_bytes}")

# Apply a new configuration (atomic replace)
device.set_config(new_config)

# Apply changes incrementally (removes absent peers, skips unchanged)
device.sync_config(new_config)

device.close()
```

### wg-quick from Python

Bring interfaces up and down. Requires root or `CAP_NET_ADMIN`.

```python
from wireguard_tools.wg_quick import up, down, WgQuickError

try:
    up("wg0")
except WgQuickError as e:
    print(f"Failed: {e}")

# Later...
down("wg0")
```

The `up()` function:

- Reads `/etc/wireguard/wg0.conf` (or a full path to a `.conf` file)
- Creates the WireGuard interface via netlink
- Applies keys and peers via UAPI/Netlink
- Assigns addresses, sets MTU, brings the link up
- Installs routes for AllowedIPs
- Configures DNS via `resolvconf` if specified
- Runs Pre/PostUp hooks

### Daemon Client

Connect to `wg-daemon` from an unprivileged process. The daemon must be
running separately (see [DAEMON.md](DAEMON.md)).

```python
from wireguard_tools.daemon_client import WgDaemonClient, DaemonError

client = WgDaemonClient()  # uses WG_DAEMON_SOCKET or default path

# Interface management
client.up("wg0")
client.down("wg0")

# Query
config_dict = client.show("wg0")
interfaces = client.list_devices()

# Peer management
client.set_peer(
    "wg0",
    "base64pubkey=",
    allowed_ips=["10.0.0.2/32"],
    endpoint_host="203.0.113.1",
    endpoint_port=51820,
    persistent_keepalive=25,
)
client.remove_peer("wg0", "base64pubkey=")

# Error handling
try:
    client.up("wg0")
except DaemonError as e:
    print(f"Daemon error: {e}")
except ConnectionRefusedError:
    print("Daemon is not running")
```

## API Reference

### WireguardKey

| Method | Description |
| --- | --- |
| `WireguardKey(value)` | Parse a key from base64, hex, urlsafe base64, or raw bytes |
| `WireguardKey.generate()` | Generate a new Curve25519 private key |
| `.public_key()` | Derive the corresponding public key |
| `str(key)` | Base64-encoded string |
| `.urlsafe` | URL-safe base64 (no padding) |
| `.hex()` | Hexadecimal string |
| `.keydata` | Raw 32-byte `bytes` |

### WireguardPeer

| Field | Type | Description |
| --- | --- | --- |
| `public_key` | `WireguardKey` | Peer's public key (required) |
| `preshared_key` | `WireguardKey` or `None` | Optional pre-shared key |
| `endpoint_host` | `IPv4Address`, `IPv6Address`, `str`, or `None` | Endpoint hostname or IP |
| `endpoint_port` | `int` or `None` | Endpoint port |
| `persistent_keepalive` | `int` or `None` | Keepalive interval in seconds |
| `allowed_ips` | `list` | List of `IPv4Interface`/`IPv6Interface` |
| `friendly_name` | `str` or `None` | Human-readable label (from config comments) |
| `friendly_json` | `dict` or `None` | Structured metadata (from config comments) |
| `last_handshake` | `float` or `None` | Unix timestamp of last handshake (runtime only) |
| `rx_bytes` | `int` or `None` | Bytes received (runtime only) |
| `tx_bytes` | `int` or `None` | Bytes transmitted (runtime only) |

| Method | Description |
| --- | --- |
| `.from_dict(d)` | Create from a dict (handles `endpoint` -> host/port split) |
| `.from_wgconfig(kv)` | Create from parsed config key-value pairs |
| `.asdict()` | Serialize to dict (non-None fields only) |
| `.as_wgconfig_snippet()` | Serialize to config file lines |

### WireguardConfig

| Field | Type | Description |
| --- | --- | --- |
| `private_key` | `WireguardKey` or `None` | Interface private key |
| `listen_port` | `int` or `None` | UDP listen port |
| `fwmark` | `int` or `None` | Firewall mark |
| `peers` | `dict[WireguardKey, WireguardPeer]` | Peers keyed by public key |
| `addresses` | `list` | Interface addresses (wg-quick) |
| `dns_servers` | `list` | DNS servers (wg-quick) |
| `mtu` | `int` or `None` | MTU (wg-quick) |
| `table` | `str` or `None` | Routing table: `auto`, `off`, or number (wg-quick) |
| `preup`, `postup`, `predown`, `postdown` | `list[str]` | Hook commands (wg-quick) |
| `saveconfig` | `bool` | SaveConfig flag (wg-quick) |

| Method | Description |
| --- | --- |
| `.from_wgconfig(fileobj)` | Parse a WireGuard config file |
| `.from_dict(d)` | Create from a dict |
| `.asdict()` | Serialize to dict |
| `.to_wgconfig(wgquick_format=False)` | Serialize to config file string |
| `.to_resolvconf()` | Generate `resolv.conf` content for DNS settings |
| `.to_qrcode()` | Generate a `segno.QRCode` object |
| `.add_peer(peer)` | Add or replace a peer |
| `.del_peer(key)` | Remove a peer by public key |

### WireguardDevice

| Method | Description |
| --- | --- |
| `WireguardDevice.get(ifname)` | Open a device (UAPI first, then Netlink) |
| `WireguardDevice.list()` | Iterate all WireGuard devices |
| `.get_config()` | Read current device configuration |
| `.set_config(config)` | Atomic replace (setconf) |
| `.sync_config(config)` | Incremental update (syncconf) |
| `.close()` | Release resources |

### WgDaemonClient

| Method | Description |
| --- | --- |
| `WgDaemonClient(socket_path=None)` | Connect to daemon (uses `WG_DAEMON_SOCKET` env var or default) |
| `.up(interface)` | Bring up interface |
| `.down(interface)` | Bring down interface |
| `.show(interface)` | Query interface config (returns dict) |
| `.set_peer(interface, public_key, **kwargs)` | Add/update peer |
| `.remove_peer(interface, public_key)` | Remove peer |
| `.list_devices()` | List active interfaces |

Raises `DaemonError` on error responses, `ConnectionRefusedError` or
`FileNotFoundError` if the daemon is not running.

## Environment Variables

| Variable | Used By | Default | Description |
| --- | --- | --- | --- |
| `WG_ENDPOINT_RESOLUTION_RETRIES` | UAPI backend | `15` | Max DNS retries for peer endpoints; `infinity` for unlimited |
| `WG_HIDE_KEYS` | CLI (`wg show`) | (keys shown) | Set to `never` to display keys; any other value hides them |
| `WG_DAEMON_SOCKET` | Daemon and client | `/var/run/wg-daemon.sock` | Unix socket path |
| `WG_DAEMON_GROUP` | Daemon | `wireguard` | Socket group ownership |
