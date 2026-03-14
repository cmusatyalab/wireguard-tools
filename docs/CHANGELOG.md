# Changelog

## v0.7.0.dev0 (2026-03-14)

This release significantly extends the upstream library with a complete CLI,
pure-Python `wg-quick`, and a privileged daemon for IPC-based privilege
separation. All changes are backward-compatible with the v0.6.0 public API.

### Core library fixes

- **IPv6 endpoint parsing**: New `_parse_endpoint()` function correctly handles
  bracket notation (`[::1]:51820`) throughout config parsing, UAPI
  serialization, and wgconfig output.
- **Robust comma-list parsing**: `_split_comma_list()` filters empty entries
  from inputs like `"10.0.0.0/24,"` or `"a,,b"` that previously raised
  `ValueError` in downstream parsers.
- **Hex FwMark support**: FwMark values now accept both hexadecimal (`0x1234`)
  and decimal formats via `int(value, 0)`.
- **Case-insensitive SaveConfig**: Parsing now uses `value.lower() == "true"`
  instead of an exact match.

### UAPI backend (`wireguard_uapi.py`)

- Hostname resolution with `WG_ENDPOINT_RESOLUTION_RETRIES` support, matching
  the behavior of the C `wg(8)` implementation.
- Correct IPv6 endpoint formatting in UAPI `endpoint=` lines (bracket
  notation).
- Preshared keys are now hex-encoded in the UAPI protocol (was incorrectly
  passing base64).
- Distinct `set_config()` and `sync_config()` methods: `set_config` does
  atomic replace (`replace_peers=true`); `sync_config` diffs against running
  state and applies only changes.
- Extracted `_build_peer_uapi()` and `_send_uapi_set()` helpers.

### Netlink backend (`wireguard_netlink.py`)

- Refactored shared logic into `_apply_config()` used by both `set_config` and
  `sync_config`.

### Device abstraction (`wireguard_device.py`)

- Added `sync_config()` to the abstract base class with a default fallback
  to `set_config()`.

### CLI (`cli.py`)

- **`wg set`**: Full argument parser supporting `peer`, `endpoint`,
  `allowed-ips` (replace and incremental), `preshared-key`,
  `persistent-keepalive`, and `remove`.
- **`wg addconf`** and **`wg syncconf`** subcommands.
- **`wg show`** enhancements: `dump` format, per-field filtering, `interfaces`
  mode, `WG_HIDE_KEYS` support.
- **`wg-py up`** and **`wg-py down`** subcommands.

### Pure-Python wg-quick (`wg_quick.py`) -- new module

- `up()` and `down()` functions implementing `wg-quick(8)` using `pyroute2`
  for netlink-based interface, address, route, and fwmark rule management.
- DNS setup/teardown via `resolvconf`.
- Pre/PostUp/Down hook execution with `WIREGUARD_INTERFACE` env var.
- `Table = auto|off|<number>` routing logic with catch-all AllowedIPs
  detection.

### Privileged daemon (`daemon.py`, `daemon_client.py`) -- new modules

- JSON-over-Unix-socket server (`wg-daemon`) enabling privilege separation.
- 6 commands: `up`, `down`, `show`, `set_peer`, `remove_peer`, `list_devices`.
- `WgDaemonClient` class for easy IPC from any Python consumer.
- Systemd service template in `contrib/wg-daemon.service`.

### Tests

- 67 new tests across 5 test files:
  - `test_cli_commands.py` (21): `_parse_set_args` and show field coverage
  - `test_config_parsing.py` (26): endpoint parsing, comma lists, IPv6
    roundtrip, FwMark hex, Table/SaveConfig
  - `test_uapi_protocol.py` (12): peer UAPI serialization, set/sync config,
    endpoint resolution
  - `test_wg_quick.py` (11): config resolution, table routing, network
    collection, up/down guards
  - `test_daemon.py` (15): full protocol coverage with mocked privileged
    operations

### Other

- Exposed `__version__` in `__init__.py`.
- Added `wg-daemon` console script entry point.

## v0.6.0 and earlier

See the upstream [cmusatyalab/wireguard-tools](https://github.com/cmusatyalab/wireguard-tools)
repository for prior release history.
