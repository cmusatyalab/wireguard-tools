# WireGuard-tools

Pure Python reimplementation of wireguard-tools with an aim to provide easily
reusable library functions to handle reading and writing of
[WireGuard](https://www.wireguard.com/) configuration files as well as
interacting with WireGuard devices, both in-kernel through the Netlink API and
userspace implementations through the cross-platform UAPI API.

This fork extends the upstream
[cmusatyalab/wireguard-tools](https://github.com/cmusatyalab/wireguard-tools)
with a complete CLI, a pure-Python `wg-quick` implementation, and a privileged
daemon for IPC-based privilege separation.

## Installation

```sh
pip install wireguard-tools
wg-py --help
```

For the latest development version:

```sh
pip install git+https://github.com/radawson/wireguard-tools.git@dev
```

## CLI Commands

### `wg-py` -- WireGuard configuration tool

Implemented `wg` command-line functionality:

- [x] show -- Show configuration and device information (dump, field filtering, `WG_HIDE_KEYS`)
- [x] showconf -- Dump current device configuration
- [x] set -- Change current configuration, add/remove/change peers
- [x] setconf -- Apply configuration to device (atomic replace)
- [x] addconf -- Append configuration to device
- [x] syncconf -- Synchronize configuration with device (diff and apply)
- [x] genkey, genpsk, pubkey -- Key generation

Also includes `wg-quick` functions:

- [x] up, down -- Create and configure WireGuard device and interface
- [x] save -- Dump device and interface configuration
- [x] strip -- Filter wg-quick settings from configuration

Needs root (sudo) access to query and configure WireGuard devices through
netlink. But root doesn't know about the currently active virtualenv, so you
may have to pass the full path to the script, or use `python3 -m wireguard_tools`:

```sh
sudo $(which wg-py) showconf <interface>
sudo /path/to/venv/python3 -m wireguard_tools showconf <interface>
```

### `wg-daemon` -- Privileged helper daemon

A JSON-over-Unix-socket daemon that runs as root and exposes WireGuard
operations to unprivileged clients. This enables privilege separation: your
application connects to the daemon socket instead of requiring root access
itself.

```sh
sudo wg-daemon --socket /var/run/wg-daemon.sock --group wireguard
```

See [docs/DAEMON.md](docs/DAEMON.md) for protocol details, systemd setup, and
security model.

## Library Usage

### Parsing WireGuard keys

The `WireguardKey` class parses base64-encoded keys (standard and urlsafe
variants) and hex-encoded keys. It also exposes private key generation and
public key derivation. Pass any base64 or hex encoded keys as `str`, not
`bytes` -- a `bytes` value is assumed to be the already-decoded raw key.

```python
from wireguard_tools import WireguardKey

private_key = WireguardKey.generate()
public_key = private_key.public_key()

print(public_key)          # base64
print(public_key.urlsafe)  # urlsafe base64
print(public_key.hex())    # hexadecimal
```

### Working with configuration files

The WireGuard configuration file format uses duplicate keys for both section
names (`[Peer]`) and configuration keys within a section. `AllowedIPs`,
`Address`, and `DNS` may be specified multiple times.

```python
from wireguard_tools import WireguardConfig

with open("wg0.conf") as fh:
    config = WireguardConfig.from_wgconfig(fh)
```

"Friendly Tags" comments (as introduced by prometheus-wireguard-exporter) are
supported:

```ini
[Peer]
# friendly_name = Peer description for end users
# friendly_json = {"flat": "json", "dictionary": 1, "attribute": 2}
```

These appear as `friendly_name` and `friendly_json` attributes on the
`WireguardPeer` object.

Serialize and deserialize from a dict-based format using only basic JSON types:

```python
from wireguard_tools import WireguardConfig

dict_config = dict(
    private_key="...",
    peers=[
        dict(
            public_key="...",
            endpoint_host="remote_host",
            endpoint_port=51820,
            persistent_keepalive=25,
            allowed_ips=["10.0.0.0/24"],
            friendly_name="My Peer",
        ),
    ],
)
config = WireguardConfig.from_dict(dict_config)
roundtrip = config.asdict()
```

Generate a QR code scannable by the WireGuard mobile app:

```python
qr = config.to_qrcode()
qr.save("wgconfig.png")
qr.terminal(compact=True)
```

### Working with WireGuard devices

```python
from wireguard_tools import WireguardDevice

ifnames = [device.interface for device in WireguardDevice.list()]

device = WireguardDevice.get("wg0")
config = device.get_config()

device.set_config(config)   # atomic replace (setconf semantics)
device.sync_config(config)  # diff and apply changes only (syncconf semantics)
```

`WireguardDevice.get()` tries the UAPI backend first (userspace socket in
`/var/run/wireguard/`), then falls back to the Netlink backend (in-kernel).

### Using wg-quick from Python

Bring interfaces up and down programmatically. Requires root or `CAP_NET_ADMIN`.

```python
from wireguard_tools.wg_quick import up, down

up("wg0")    # equivalent to: wg-quick up wg0
down("wg0")  # equivalent to: wg-quick down wg0
```

The implementation uses `pyroute2` for netlink-based interface, address, and
route management -- no shell commands are spawned for network operations.

### Using the daemon client

Connect to a running `wg-daemon` instance from an unprivileged process:

```python
from wireguard_tools.daemon_client import WgDaemonClient

client = WgDaemonClient()  # or WgDaemonClient("/var/run/wg-daemon.sock")

client.up("wg0")
client.down("wg0")

config = client.show("wg0")

client.set_peer("wg0", "base64pubkey...", allowed_ips=["10.0.0.2/32"])
client.remove_peer("wg0", "base64pubkey...")

interfaces = client.list_devices()
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `WG_ENDPOINT_RESOLUTION_RETRIES` | `15` | Max DNS resolution retries for peer endpoints (`infinity` for unlimited) |
| `WG_HIDE_KEYS` | unset | When set to `never`, `wg show` displays private and preshared keys |
| `WG_DAEMON_SOCKET` | `/var/run/wg-daemon.sock` | Unix socket path for daemon/client |
| `WG_DAEMON_GROUP` | `wireguard` | Group ownership for the daemon socket |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) -- Module map, layer diagram, backend selection
- [Daemon](docs/DAEMON.md) -- Protocol spec, systemd setup, security model
- [Integration Guide](docs/INTEGRATION.md) -- Developer guide with API reference
- [Changelog](docs/CHANGELOG.md) -- Version history

## Licenses

wireguard-tools is MIT licensed

```text
Copyright (c) 2022-2024 Carnegie Mellon University
Copyright (c) 2024-2026 Richard Dawson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`wireguard_tools/curve25519.py` was released in the public domain

```text
Copyright Nicko van Someren, 2021. This code is released into the public domain.
https://gist.github.com/nickovs/cc3c22d15f239a2640c185035c06f8a3
```

"WireGuard" is a registered trademark of Jason A. Donenfeld.
