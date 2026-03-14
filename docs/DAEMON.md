# wg-daemon -- Privileged Helper Daemon

## Purpose

`wg-daemon` is a thin JSON-over-Unix-socket server that runs with root
privileges (or `CAP_NET_ADMIN`) and exposes WireGuard operations to
unprivileged clients. This enables privilege separation: your web application,
CLI tool, or automation script connects to the daemon socket instead of
requiring root access itself.

## Protocol

The daemon listens on a Unix stream socket. Each client connection handles
exactly one request-response cycle:

1. Client connects to the socket
2. Client sends a single JSON object followed by a newline
3. Client shuts down the write side of the connection (`SHUT_WR`)
4. Daemon processes the request and writes a JSON response followed by a newline
5. Connection closes

### Request Format

```json
{"cmd": "<command>", "args": {<arguments>}}
```

### Response Format

Success:

```json
{"ok": true}
```

Success with data:

```json
{"ok": true, "data": <result>}
```

Error:

```json
{"ok": false, "error": "Human-readable error message"}
```

## Commands

### up

Bring up a WireGuard interface (equivalent to `wg-quick up`).

```json
{"cmd": "up", "args": {"interface": "wg0"}}
```

### down

Bring down a WireGuard interface (equivalent to `wg-quick down`).

```json
{"cmd": "down", "args": {"interface": "wg0"}}
```

### show

Query a WireGuard device and return its configuration as a dict.

```json
{"cmd": "show", "args": {"interface": "wg0"}}
```

Response `data` contains the full config dict (private key, listen port,
fwmark, peers with their allowed IPs, endpoints, transfer stats, etc.).

### set_peer

Add or update a peer on a running interface.

```json
{
  "cmd": "set_peer",
  "args": {
    "interface": "wg0",
    "public_key": "base64encodedkey=",
    "allowed_ips": ["10.0.0.2/32", "fd00::2/128"],
    "endpoint_host": "203.0.113.1",
    "endpoint_port": 51820,
    "preshared_key": "base64encodedpsk=",
    "persistent_keepalive": 25
  }
}
```

Only `interface` and `public_key` are required. All other fields are optional.

### remove_peer

Remove a peer from a running interface.

```json
{
  "cmd": "remove_peer",
  "args": {
    "interface": "wg0",
    "public_key": "base64encodedkey="
  }
}
```

### list_devices

List all active WireGuard interfaces.

```json
{"cmd": "list_devices", "args": {}}
```

Response `data` is a list of interface name strings, e.g. `["wg0", "wg1"]`.

## Configuration

### Command-line flags

| Flag | Default | Description |
| --- | --- | --- |
| `--socket PATH` | `/var/run/wg-daemon.sock` | Unix socket path |
| `--group NAME` | `wireguard` | Group ownership for socket file |
| `-v, --verbose` | off | Enable debug logging |

### Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `WG_DAEMON_SOCKET` | `/var/run/wg-daemon.sock` | Overrides default socket path (used by both daemon and client) |
| `WG_DAEMON_GROUP` | `wireguard` | Overrides default group |

## Systemd Setup

A template service file is provided at `contrib/wg-daemon.service`.

### Step-by-step installation

1. Create the `wireguard` group:

```bash
sudo groupadd wireguard
```

1. Add your application user to the group:

```bash
sudo usermod -aG wireguard <app-user>
```

The user must log out and back in for the group membership to take effect.

1. Install the service file:

```bash
sudo cp contrib/wg-daemon.service /etc/systemd/system/
```

1. Edit `ExecStart` to point at the virtualenv where wireguard-tools is
   installed:

```ini
ExecStart=/home/<user>/wireguard-tools/.venv/bin/wg-daemon
```

1. Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wg-daemon.service
```

1. Verify:

```bash
sudo systemctl status wg-daemon.service
ls -la /var/run/wg-daemon.sock
```

The socket should be owned by `root:wireguard` with permissions `srw-rw----`.

## Security Model

### Socket permissions

The daemon socket is created with mode `0660` and group-owned by the
configured group (default: `wireguard`). Only root and members of this group
can connect. This is the sole access control mechanism -- any process that can
open the socket can execute any daemon command.

### Systemd hardening

The provided service file includes:

| Directive | Value | Purpose |
| --- | --- | --- |
| `ProtectSystem` | `strict` | Mount `/usr`, `/boot`, `/efi` read-only |
| `ProtectHome` | `read-only` | Prevent writes to `/home` |
| `PrivateTmp` | `yes` | Isolate `/tmp` and `/var/tmp` |
| `NoNewPrivileges` | `no` | Must be `no` because network operations require privileges |

### What the daemon can do

The daemon can create/destroy WireGuard interfaces, modify peers, and manage
routes. It intentionally exposes a narrow API surface (6 commands) rather than
arbitrary shell access.

### What the daemon cannot do

- It does not execute arbitrary commands
- It does not read or write arbitrary files
- It does not expose private keys over the socket (the `show` command returns
  them in the config dict, but the socket is group-restricted)

## Troubleshooting

### Socket does not exist

Check that the daemon is running:

```bash
sudo systemctl status wg-daemon.service
sudo journalctl -u wg-daemon.service -n 50
```

### Permission denied connecting to socket

Verify group membership:

```bash
groups <app-user>  # should include 'wireguard'
ls -la /var/run/wg-daemon.sock  # should show srw-rw---- root wireguard
```

If you just added the user to the group, they need to log out and back in (or
restart the application service).

### Testing with socat

Send a raw request to verify the daemon is responding:

```bash
echo '{"cmd":"list_devices","args":{}}' | socat - UNIX-CONNECT:/var/run/wg-daemon.sock
```

### Testing with Python

```python
from wireguard_tools.daemon_client import WgDaemonClient
client = WgDaemonClient()
print(client.list_devices())
```
