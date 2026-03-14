# Architecture

## Module Map

| Module | Purpose |
| --- | --- |
| `wireguard_key.py` | Key parsing (base64, hex, urlsafe), generation, and public key derivation |
| `curve25519.py` | Pure-Python Curve25519 scalar multiplication (no C dependencies) |
| `wireguard_config.py` | `WireguardConfig` and `WireguardPeer` data classes; parsing and serialization of `.conf` files and dict roundtrips |
| `wireguard_device.py` | `WireguardDevice` abstract base class with backend discovery (`get()` and `list()`) |
| `wireguard_uapi.py` | UAPI backend -- communicates with userspace WireGuard via `/var/run/wireguard/<ifname>.sock` |
| `wireguard_netlink.py` | Netlink backend -- communicates with in-kernel WireGuard via `pyroute2` |
| `wg_quick.py` | Pure-Python `wg-quick up/down` using `pyroute2` for interface, address, route, and rule management |
| `cli.py` | `wg-py` command-line interface implementing all `wg(8)` subcommands plus `up`/`down` |
| `daemon.py` | `wg-daemon` -- threaded Unix socket server dispatching JSON commands to library functions |
| `daemon_client.py` | `WgDaemonClient` -- thin IPC client for connecting to `wg-daemon` |
| `__init__.py` | Public API surface: re-exports `WireguardConfig`, `WireguardPeer`, `WireguardDevice`, `WireguardKey` |

## Layer Diagram

```mermaid
flowchart TB
    subgraph consumers [Consumers]
        CLI["cli.py\nwg-py command"]
        Daemon["daemon.py\nwg-daemon"]
        DaemonClient["daemon_client.py\nWgDaemonClient"]
        WgQuick["wg_quick.py\nup / down"]
    end

    subgraph core [Core Library]
        Config["wireguard_config.py\nWireguardConfig / WireguardPeer"]
        Device["wireguard_device.py\nWireguardDevice ABC"]
        Key["wireguard_key.py\nWireguardKey"]
        Curve["curve25519.py\nX25519"]
    end

    subgraph backends [Device Backends]
        UAPI["wireguard_uapi.py\nWireguardUAPIDevice"]
        Netlink["wireguard_netlink.py\nWireguardNetlinkDevice"]
    end

    subgraph external [External]
        KernelWG["Kernel WireGuard\nvia Netlink"]
        UserWG["Userspace WireGuard\nvia /var/run/wireguard/"]
        Pyroute["pyroute2\nNetlink library"]
    end

    CLI --> Config
    CLI --> Device
    CLI --> WgQuick
    Daemon --> WgQuick
    Daemon --> Device
    DaemonClient -->|"JSON over Unix socket"| Daemon

    WgQuick --> Config
    WgQuick --> Device
    WgQuick --> Pyroute

    Device --> UAPI
    Device --> Netlink
    Key --> Curve

    Config --> Key
    UAPI --> UserWG
    Netlink --> Pyroute
    Pyroute --> KernelWG
```

## Backend Selection

`WireguardDevice.get(ifname)` selects the backend automatically:

1. **UAPI first**: Checks for `/var/run/wireguard/<ifname>.sock`. If the socket exists, returns a `WireguardUAPIDevice`. This handles userspace WireGuard implementations (e.g., wireguard-go, boringtun).
2. **Netlink fallback**: If no UAPI socket is found, returns a `WireguardNetlinkDevice` which talks directly to the in-kernel WireGuard module via `pyroute2`.

`WireguardDevice.list()` yields devices from both backends, querying Netlink first and then scanning the UAPI socket directory.

## setconf vs syncconf

Both backends now implement distinct behaviors:

- **`set_config()`** (setconf semantics): Atomically replaces the full interface configuration. Sends `replace_peers=true` in UAPI; in Netlink, diffs against current state but applies all peers.
- **`sync_config()`** (syncconf semantics): Diffs the desired config against the running config and applies only changes -- removes absent peers, skips unchanged ones, updates modified ones.

## Data Flow: `wg-quick up wg0`

1. `_find_config("wg0")` resolves to `/etc/wireguard/wg0.conf`
2. Config file is parsed into a `WireguardConfig` object
3. PreUp hooks execute (shell commands with `WIREGUARD_INTERFACE` env var)
4. `pyroute2` creates the `wg0` interface (`ip link add wg0 type wireguard`)
5. `WireguardDevice.get("wg0")` opens the appropriate backend
6. `device.set_config(config)` applies keys, peers, and endpoints via UAPI/Netlink
7. Addresses are assigned via `pyroute2` (`ip addr add`)
8. Link is brought up with MTU (`ip link set wg0 up mtu 1420`)
9. Routes are added for each peer's AllowedIPs
10. If catch-all AllowedIPs (`0.0.0.0/0` or `::/0`) are present with `Table = auto`, fwmark rules and suppress-prefix rules are installed
11. DNS is configured via `resolvconf` if DNS servers are specified
12. PostUp hooks execute

If any step after interface creation fails, the interface is deleted to avoid leaving a half-configured device.

## Data Flow: Daemon IPC

```mermaid
sequenceDiagram
    participant App as Application
    participant Client as WgDaemonClient
    participant Socket as Unix Socket
    participant Daemon as wg-daemon
    participant WG as WireGuard

    App->>Client: client.up("wg0")
    Client->>Socket: connect()
    Client->>Socket: {"cmd":"up","args":{"interface":"wg0"}}
    Socket->>Daemon: read request
    Daemon->>WG: wg_quick.up("wg0")
    WG-->>Daemon: success
    Daemon->>Socket: {"ok":true}
    Socket-->>Client: read response
    Client-->>App: return
```

The daemon handles one request per connection. The client connects, sends a
single JSON line, shuts down the write side, reads the response, and
disconnects. This stateless design avoids connection management complexity.
