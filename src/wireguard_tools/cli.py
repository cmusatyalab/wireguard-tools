#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

"""Command-line interface for the pure-Python WireGuard tools.

Provides subcommands that mirror the ``wg(8)`` utility: ``show``, ``showconf``,
``set``, ``setconf``, ``addconf``, ``syncconf``, ``genkey``, ``genpsk``,
``pubkey``, and ``strip``.  Additionally exposes ``up`` and ``down`` as
convenience wrappers around the :mod:`wireguard_tools.wg_quick` module.

Each public subcommand function accepts an :class:`argparse.Namespace` and
returns an ``int`` exit code (``0`` for success, ``1`` for failure).  The
module is intended to be invoked via :func:`main` or as
``python -m wireguard_tools.cli``.
"""

from __future__ import annotations

import argparse
import os
import sys
from contextlib import closing
from ipaddress import IPv6Address, ip_interface
from secrets import token_bytes
from stat import S_IRWXO, S_ISREG
from typing import Any, Iterable

from .wireguard_config import (
    WireguardConfig,
    WireguardPeer,
    _parse_endpoint,
    _split_comma_list,
)
from .wireguard_device import WireguardDevice
from .wireguard_key import WireguardKey


SHOW_FIELDS = (
    "public-key",
    "private-key",
    "listen-port",
    "fwmark",
    "peers",
    "preshared-keys",
    "endpoints",
    "allowed-ips",
    "latest-handshakes",
    "persistent-keepalive",
    "transfer",
    "dump",
)
"""Valid field names accepted by the ``wg show`` subcommand.

When a single positional argument is passed to ``wg show`` and it matches one
of these strings, it is interpreted as a *field selector* applied to every
interface rather than an interface name.  The ``"dump"`` pseudo-field triggers
the machine-readable tab-separated output format.
"""


def _format_endpoint(peer: WireguardPeer) -> str:
    """Format a peer's endpoint as a human-readable ``host:port`` string.

    IPv6 addresses are enclosed in brackets to disambiguate the colon-delimited
    address from the port separator (e.g. ``[::1]:51820``).

    :param peer: The peer whose endpoint should be formatted.
    :returns: ``"(none)"`` when the peer has no endpoint configured, otherwise
        a ``host:port`` string.
    :rtype: str
    """
    if peer.endpoint_host is None:
        return "(none)"
    host = peer.endpoint_host
    if isinstance(host, IPv6Address):
        return f"[{host}]:{peer.endpoint_port}"
    return f"{host}:{peer.endpoint_port}"


def _show_pretty(
    device: WireguardDevice, config: WireguardConfig, hide_keys: bool
) -> None:
    """Print a human-readable summary of an interface and its peers to stdout.

    The output mirrors the default ``wg show <interface>`` format: interface-level
    fields (public key, private key, listening port, fwmark) followed by a blank
    line and per-peer blocks (preshared key, endpoint, keepalive, allowed IPs,
    latest handshake, transfer statistics).

    :param device: The device whose name will be shown in the ``interface:``
        header line.
    :param config: The configuration snapshot to render.
    :param hide_keys: When ``True``, private and preshared keys are replaced
        with ``"(hidden)"``.  Controlled by the ``WG_HIDE_KEYS`` environment
        variable at the call-site.
    :rtype: None
    """
    print(f"interface: {device.interface}")
    if config.private_key is not None:
        print(f"  public key: {config.private_key.public_key()}")
        print(f"  private key: {'(hidden)' if hide_keys else config.private_key}")
    if config.listen_port is not None:
        print(f"  listening port: {config.listen_port}")
    if config.fwmark is not None:
        print(f"  fwmark: {config.fwmark:#x}")
    print()

    for peer in config.peers.values():
        print(f"peer: {peer.public_key}")
        if peer.preshared_key:
            print(
                f"  preshared key: {'(hidden)' if hide_keys else peer.preshared_key}"
            )
        if peer.endpoint_host:
            print(f"  endpoint: {_format_endpoint(peer)}")
        if peer.persistent_keepalive:
            print(
                f"  persistent keepalive: every {peer.persistent_keepalive} seconds"
            )
        if peer.allowed_ips:
            allowed_ips = ", ".join(str(addr) for addr in peer.allowed_ips)
            print(f"  allowed ips: {allowed_ips}")
        if peer.last_handshake:
            print(f"  latest handshake: {peer.last_handshake}")
        if peer.rx_bytes is not None and peer.tx_bytes is not None:
            print(
                "  transfer:"
                f" {peer.rx_bytes / 1024:.2f} KiB received,"
                f" {peer.tx_bytes / 1024:.2f} KiB sent",
            )
        print()


def _show_dump(
    device: WireguardDevice, config: WireguardConfig, prefix_iface: bool
) -> None:
    """Print the machine-readable tab-separated dump of an interface.

    The first line contains interface-level fields
    (``private-key  public-key  listen-port  fwmark``) and each subsequent line
    contains per-peer fields (``public-key  preshared-key  endpoint  allowed-ips
    latest-handshake  rx  tx  persistent-keepalive``).  When *prefix_iface* is
    ``True`` every line is prefixed with the interface name — this is the format
    used by ``wg show all dump``.

    :param device: The device providing the interface name.
    :param config: The configuration snapshot to render.
    :param prefix_iface: Prepend ``<ifname>\\t`` to every output line.
    :rtype: None
    """
    pfx = f"{device.interface}\t" if prefix_iface else ""
    private_key = str(config.private_key) if config.private_key else "(none)"
    public_key = (
        str(config.private_key.public_key()) if config.private_key else "(none)"
    )
    listen_port = config.listen_port if config.listen_port else 0
    fwmark = f"0x{config.fwmark:x}" if config.fwmark else "off"
    print(f"{pfx}{private_key}\t{public_key}\t{listen_port}\t{fwmark}")

    for peer in config.peers.values():
        psk = str(peer.preshared_key) if peer.preshared_key else "(none)"
        endpoint = _format_endpoint(peer)
        allowed = ", ".join(str(a) for a in peer.allowed_ips) or "(none)"
        handshake = int(peer.last_handshake) if peer.last_handshake else 0
        rx = peer.rx_bytes or 0
        tx = peer.tx_bytes or 0
        keepalive = peer.persistent_keepalive if peer.persistent_keepalive else "off"
        print(
            f"{pfx}{peer.public_key}\t{psk}\t{endpoint}\t{allowed}"
            f"\t{handshake}\t{rx}\t{tx}\t{keepalive}"
        )


def _show_field(
    device: WireguardDevice,
    config: WireguardConfig,
    field: str,
    prefix_iface: bool,
) -> None:
    """Print a single field value for an interface and its peers.

    For interface-level fields (``public-key``, ``private-key``, ``listen-port``,
    ``fwmark``) one line is emitted.  For per-peer fields (``peers``,
    ``preshared-keys``, ``endpoints``, ``allowed-ips``, ``latest-handshakes``,
    ``persistent-keepalive``, ``transfer``) one line is emitted per peer.

    :param device: The device providing the interface name.
    :param config: The configuration snapshot to render.
    :param field: One of the :data:`SHOW_FIELDS` names (excluding ``"dump"``
        which is handled by :func:`_show_dump`).
    :param prefix_iface: Prepend ``<ifname>\\t`` to every output line.
    :rtype: None
    """
    pfx = f"{device.interface}\t" if prefix_iface else ""
    if field == "public-key":
        if config.private_key:
            print(f"{pfx}{config.private_key.public_key()}")
    elif field == "private-key":
        if config.private_key:
            print(f"{pfx}{config.private_key}")
    elif field == "listen-port":
        print(f"{pfx}{config.listen_port or 0}")
    elif field == "fwmark":
        print(f"{pfx}{f'0x{config.fwmark:x}' if config.fwmark else 'off'}")
    elif field == "peers":
        for peer in config.peers.values():
            print(f"{pfx}{peer.public_key}")
    elif field == "preshared-keys":
        for peer in config.peers.values():
            psk = str(peer.preshared_key) if peer.preshared_key else "(none)"
            print(f"{pfx}{peer.public_key}\t{psk}")
    elif field == "endpoints":
        for peer in config.peers.values():
            print(f"{pfx}{peer.public_key}\t{_format_endpoint(peer)}")
    elif field == "allowed-ips":
        for peer in config.peers.values():
            allowed = ", ".join(str(a) for a in peer.allowed_ips) or "(none)"
            print(f"{pfx}{peer.public_key}\t{allowed}")
    elif field == "latest-handshakes":
        for peer in config.peers.values():
            hs = int(peer.last_handshake) if peer.last_handshake else 0
            print(f"{pfx}{peer.public_key}\t{hs}")
    elif field == "persistent-keepalive":
        for peer in config.peers.values():
            ka = peer.persistent_keepalive if peer.persistent_keepalive else "off"
            print(f"{pfx}{peer.public_key}\t{ka}")
    elif field == "transfer":
        for peer in config.peers.values():
            rx = peer.rx_bytes or 0
            tx = peer.tx_bytes or 0
            print(f"{pfx}{peer.public_key}\t{rx}\t{tx}")


def _resolve_show_args(
    show_args: list[str],
) -> tuple[str | None, str | None]:
    """Resolve ``wg show`` positional arguments into an (interface, field) pair.

    Disambiguation rules:

    * **No arguments** — show all interfaces in pretty mode:
      ``(None, None)``.
    * **One argument that matches a** :data:`SHOW_FIELDS` **name** — treat it
      as a field selector for every interface: ``(None, field)``.
    * **One argument that does** *not* **match a field** — treat it as an
      interface name: ``(interface, None)``.
    * **Two arguments** — first is the interface, second must be a valid field:
      ``(interface, field)``.

    :param show_args: Positional arguments from the ``wg show`` invocation
        (0–2 items).
    :returns: A ``(interface, field)`` tuple where either element may be
        ``None``.
    :rtype: tuple[str | None, str | None]
    :raises ValueError: If more than two positional arguments are provided or
        the second argument is not a recognised field name.
    """
    if len(show_args) > 2:
        msg = "Usage: wg show [<interface>|all|interfaces] [<field>]"
        raise ValueError(msg)
    if not show_args:
        return None, None
    if len(show_args) == 1:
        token = show_args[0]
        if token in SHOW_FIELDS:
            return None, token
        return token, None
    interface, field = show_args
    if field not in SHOW_FIELDS:
        msg = f"Unknown field: {field}"
        raise ValueError(msg)
    return interface, field


def show(args: argparse.Namespace) -> int:
    """Display current WireGuard interface configuration and runtime state.

    Implements the ``wg show`` subcommand.  Behaviour depends on the positional
    arguments resolved by :func:`_resolve_show_args`:

    * No interface and no field — pretty-print every interface.
    * ``"interfaces"`` — list interface names only.
    * ``"all"`` or no interface with a field — iterate all interfaces showing
      the requested field.
    * Specific interface, optional field — show that interface.

    Keys are hidden by default; set ``WG_HIDE_KEYS=never`` to reveal them.

    :param args: Parsed CLI namespace.  May contain a ``show_args`` attribute
        with 0–2 positional strings.
    :returns: ``0`` on success, ``1`` on error.
    :rtype: int
    """
    hide_keys = os.environ.get("WG_HIDE_KEYS", "always") != "never"
    try:
        interface, field = _resolve_show_args(getattr(args, "show_args", []))
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1

    if interface == "interfaces":
        try:
            for dev in WireguardDevice.list():
                print(dev.interface)
                dev.close()
            return 0
        except RuntimeError as exc:
            print(exc, file=sys.stderr)
            return 1

    try:
        show_all = interface is None or interface == "all"
        if show_all:
            devices: Iterable[WireguardDevice] = WireguardDevice.list()
        else:
            devices = [WireguardDevice.get(interface)]

        for device in devices:
            config = device.get_config()
            device.close()

            if field is None:
                _show_pretty(device, config, hide_keys)
            elif field == "dump":
                _show_dump(device, config, prefix_iface=show_all)
            else:
                _show_field(device, config, field, prefix_iface=show_all)
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1
    else:
        return 0


def showconf(args: argparse.Namespace) -> int:
    """Print the running configuration of a WireGuard interface in ``wg`` config format.

    The output is suitable for piping into ``wg setconf`` or saving to a
    ``.conf`` file.  Runtime-only state (transfer counters, handshake
    timestamps) is *not* included.

    :param args: Parsed CLI namespace with an ``interface`` attribute naming the
        WireGuard device to query.
    :returns: ``0`` on success, ``1`` on error.
    :rtype: int
    """
    try:
        with closing(WireguardDevice.get(args.interface)) as device:
            config = device.get_config()
            print(config.to_wgconfig(), end="")
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def _read_key_file(path: str) -> WireguardKey | None:
    """Read a WireGuard key from a file path.

    Used by ``wg set`` for ``--private-key`` and ``--preshared-key`` options
    where the value is a filesystem path rather than a literal key string.
    ``/dev/null`` is the conventional way to *clear* a key.

    :param path: Filesystem path to the key file, or ``"/dev/null"`` to
        indicate that the key should be removed.
    :returns: A :class:`~wireguard_tools.wireguard_key.WireguardKey` parsed
        from the file contents, or ``None`` if *path* is ``"/dev/null"`` or
        the file is empty.
    :rtype: WireguardKey | None
    :raises FileNotFoundError: If *path* does not exist.
    :raises ValueError: If the file contents are not a valid WireGuard key.
    """
    if path == "/dev/null":
        return None
    with open(path) as f:
        data = f.read().strip()
    if not data:
        return None
    return WireguardKey(data)


def _parse_set_args(
    argv: list[str],
) -> tuple[str, dict[str, Any], list[dict[str, Any]]]:
    """Parse the ``wg set`` argument vector into structured parameters.

    The grammar mirrors the ``wg(8)`` man-page::

        wg set <interface>
            [listen-port <port>]
            [fwmark <fwmark> | off]
            [private-key <file-path>]
            [peer <base64-public-key>
                [remove]
                [preshared-key <file-path>]
                [endpoint <host>:<port>]
                [persistent-keepalive <interval> | off]
                [allowed-ips <ip1>[,<ip2>]... ]
            ]...

    **allowed-ips modes:**

    * *Replace mode* (default) — a plain comma-separated list replaces the
      peer's entire allowed-ips set.  An empty string clears the list.
    * *Incremental mode* — when *any* entry carries a ``+`` or ``-`` prefix,
      the list is interpreted incrementally: ``+``-prefixed (or bare) addresses
      are added and ``-``-prefixed addresses are removed.

    **Clearing semantics:**

    * ``fwmark off`` sets ``fwmark`` to ``0``.
    * ``persistent-keepalive off`` sets the value to ``0`` (disabled).
    * ``private-key /dev/null`` clears the private key (see
      :func:`_read_key_file`).

    :param argv: Raw argument list *including* the interface name as the first
        element (``args.remaining`` from the CLI parser).
    :returns: A three-tuple ``(interface, iface_params, peers)`` where
        *iface_params* is a ``dict`` of interface-level settings and *peers*
        is a ``list`` of ``dict`` objects each keyed by ``public_key`` with
        optional ``remove``, ``preshared_key``, ``endpoint_host``,
        ``endpoint_port``, ``persistent_keepalive``, ``allowed_ips``,
        ``replace_allowed_ips``, ``add_allowed_ips``, and
        ``remove_allowed_ips`` entries.
    :rtype: tuple[str, dict[str, Any], list[dict[str, Any]]]
    :raises ValueError: On unknown tokens, out-of-order peer options, or
        missing values.
    :raises IndexError: If a keyword token is the last element and its
        required value is missing.
    """
    if not argv:
        msg = "Usage: wg set <interface> [listen-port <port>] ..."
        raise ValueError(msg)

    interface = argv[0]
    iface_params: dict[str, Any] = {}
    peers: list[dict[str, Any]] = []
    current_peer: dict[str, Any] | None = None
    i = 1

    while i < len(argv):
        token = argv[i]

        if token == "listen-port":
            i += 1
            iface_params["listen_port"] = int(argv[i])
        elif token == "fwmark":
            i += 1
            val = argv[i]
            iface_params["fwmark"] = 0 if val == "off" else int(val, 0)
        elif token == "private-key":
            i += 1
            iface_params["private_key"] = _read_key_file(argv[i])
        elif token == "peer":
            i += 1
            current_peer = {"public_key": WireguardKey(argv[i])}
            peers.append(current_peer)
        elif token == "remove":
            if current_peer is None:
                msg = "'remove' must follow a 'peer' specification"
                raise ValueError(msg)
            current_peer["remove"] = True
        elif token == "preshared-key":
            if current_peer is None:
                msg = "'preshared-key' must follow a 'peer' specification"
                raise ValueError(msg)
            i += 1
            current_peer["preshared_key"] = _read_key_file(argv[i])
        elif token == "endpoint":
            if current_peer is None:
                msg = "'endpoint' must follow a 'peer' specification"
                raise ValueError(msg)
            i += 1
            host, port = _parse_endpoint(argv[i])
            current_peer["endpoint_host"] = host
            current_peer["endpoint_port"] = port
        elif token == "persistent-keepalive":
            if current_peer is None:
                msg = "'persistent-keepalive' must follow a 'peer' specification"
                raise ValueError(msg)
            i += 1
            val = argv[i]
            current_peer["persistent_keepalive"] = 0 if val == "off" else int(val)
        elif token == "allowed-ips":
            if current_peer is None:
                msg = "'allowed-ips' must follow a 'peer' specification"
                raise ValueError(msg)
            i += 1
            raw = argv[i]
            if not raw:
                current_peer["allowed_ips"] = []
                current_peer["replace_allowed_ips"] = True
            else:
                entries = _split_comma_list(raw)
                has_prefix = any(e.startswith(("+", "-")) for e in entries if e)
                if has_prefix:
                    add_ips: list[Any] = []
                    remove_ips: list[Any] = []
                    for entry in entries:
                        if entry.startswith("-"):
                            remove_ips.append(ip_interface(entry[1:]))
                        elif entry.startswith("+"):
                            add_ips.append(ip_interface(entry[1:]))
                        else:
                            add_ips.append(ip_interface(entry))
                    current_peer["add_allowed_ips"] = add_ips
                    current_peer["remove_allowed_ips"] = remove_ips
                else:
                    current_peer["allowed_ips"] = [ip_interface(e) for e in entries]
                    current_peer["replace_allowed_ips"] = True
        else:
            msg = f"Unknown option: {token}"
            raise ValueError(msg)
        i += 1

    return interface, iface_params, peers


def set_(args: argparse.Namespace) -> int:
    """Apply in-place mutations to a live WireGuard interface.

    Implements the ``wg set`` subcommand.  Reads the current device
    configuration, merges in the changes described by the raw argument vector
    (parsed by :func:`_parse_set_args`), and writes the result back.

    **Mutation semantics:**

    * ``fwmark 0`` / ``fwmark off`` — clears the firewall mark (stored as
      ``0``).
    * ``persistent-keepalive 0`` / ``persistent-keepalive off`` — disables
      keepalive (stored as ``None``).
    * ``peer <key> remove`` — deletes the peer entirely.
    * ``allowed-ips`` in *replace* mode overwrites the peer's list; in
      *incremental* mode individual addresses are added or removed.

    :param args: Parsed CLI namespace with a ``remaining`` attribute containing
        the unparsed ``wg set`` arguments.
    :returns: ``0`` on success, ``1`` on error.
    :rtype: int
    """
    try:
        interface, iface_params, peer_specs = _parse_set_args(args.remaining)
    except (ValueError, IndexError) as exc:
        print(f"Invalid arguments: {exc}", file=sys.stderr)
        return 1

    try:
        with closing(WireguardDevice.get(interface)) as device:
            config = device.get_config()

            if "private_key" in iface_params:
                config.private_key = iface_params["private_key"]
            if "listen_port" in iface_params:
                config.listen_port = iface_params["listen_port"]
            if "fwmark" in iface_params:
                # Keep explicit zero when user requests "fwmark off"/0.
                config.fwmark = iface_params["fwmark"]

            for spec in peer_specs:
                pub_key = spec["public_key"]

                if spec.get("remove"):
                    config.peers.pop(pub_key, None)
                    continue

                if pub_key in config.peers:
                    peer = config.peers[pub_key]
                else:
                    peer = WireguardPeer(public_key=pub_key)
                    config.add_peer(peer)

                if "preshared_key" in spec:
                    peer.preshared_key = spec["preshared_key"]
                if "endpoint_host" in spec:
                    peer.endpoint_host = spec["endpoint_host"]
                    peer.endpoint_port = spec["endpoint_port"]
                if "persistent_keepalive" in spec:
                    val = spec["persistent_keepalive"]
                    peer.persistent_keepalive = val if val else None

                if spec.get("replace_allowed_ips"):
                    peer.allowed_ips = spec.get("allowed_ips", [])
                else:
                    for ip in spec.get("add_allowed_ips", []):
                        if ip not in peer.allowed_ips:
                            peer.allowed_ips.append(ip)
                    for ip in spec.get("remove_allowed_ips", []):
                        if ip in peer.allowed_ips:
                            peer.allowed_ips.remove(ip)

            device.set_config(config)
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def setconf(args: argparse.Namespace) -> int:
    """Replace the entire configuration of a WireGuard interface from a file.

    Implements the ``wg setconf`` subcommand.  The file is parsed as a standard
    ``wg``-format configuration and applied atomically — any peers present on
    the device but absent from the file are removed.

    :param args: Parsed CLI namespace with ``interface`` (device name) and
        ``configfile`` (open file handle) attributes.
    :returns: ``0`` on success, ``1`` on error.
    :rtype: int
    """
    try:
        config = WireguardConfig.from_wgconfig(args.configfile)
        with closing(WireguardDevice.get(args.interface)) as device:
            device.set_config(config)
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def addconf(args: argparse.Namespace) -> int:
    """Merge a configuration file into an existing WireGuard interface.

    Implements the ``wg addconf`` subcommand.  Unlike :func:`setconf`, existing
    peers that are not mentioned in the file are left untouched.  Interface-level
    settings (``private_key``, ``listen_port``, ``fwmark``) from the file
    override the current values only when explicitly provided (i.e. non-``None``).

    :param args: Parsed CLI namespace with ``interface`` (device name) and
        ``configfile`` (open file handle) attributes.
    :returns: ``0`` on success, ``1`` on error.
    :rtype: int
    """
    try:
        new_config = WireguardConfig.from_wgconfig(args.configfile)
        with closing(WireguardDevice.get(args.interface)) as device:
            config = device.get_config()

            if new_config.private_key is not None:
                config.private_key = new_config.private_key
            if new_config.listen_port is not None:
                config.listen_port = new_config.listen_port
            if new_config.fwmark is not None:
                config.fwmark = new_config.fwmark

            for peer in new_config.peers.values():
                config.add_peer(peer)

            device.set_config(config)
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def syncconf(args: argparse.Namespace) -> int:
    """Synchronize a WireGuard interface to match a configuration file.

    Implements the ``wg syncconf`` subcommand.  This is similar to
    :func:`setconf` but uses the device-level ``sync_config`` method, which
    preserves runtime state (e.g. latest-handshake, transfer counters) for
    peers whose configuration has not changed.

    :param args: Parsed CLI namespace with ``interface`` (device name) and
        ``configfile`` (open file handle) attributes.
    :returns: ``0`` on success, ``1`` on error.
    :rtype: int
    """
    try:
        config = WireguardConfig.from_wgconfig(args.configfile)
        with closing(WireguardDevice.get(args.interface)) as device:
            device.sync_config(config)
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def _check_stdout() -> None:
    """Warn on stderr if stdout is redirected to a world-accessible file.

    Called before writing sensitive key material to stdout.  If stdout is a
    regular file whose permissions include *any* bits in ``S_IRWXO`` (other
    read/write/execute), a warning is emitted to stderr.  This mirrors the
    safety check in the upstream C ``wg`` implementation.

    :rtype: None
    """
    stat = os.fstat(sys.stdout.fileno())
    if S_ISREG(stat.st_mode) and (stat.st_mode & S_IRWXO):
        print("Warning: writing to world accessible file.", file=sys.stderr)


def genkey(_args: argparse.Namespace) -> int:
    """Generate a new Curve25519 private key and write it to stdout.

    Implements the ``wg genkey`` subcommand.  Emits a warning via
    :func:`_check_stdout` if stdout is world-readable.

    :param _args: Parsed CLI namespace (unused).
    :returns: ``0`` unconditionally.
    :rtype: int
    """
    _check_stdout()
    secret_key = WireguardKey.generate()
    print(secret_key)
    return 0


def genpsk(_args: argparse.Namespace) -> int:
    """Generate a new 256-bit preshared key and write it to stdout.

    Implements the ``wg genpsk`` subcommand.  The key is derived from 32 bytes
    of cryptographically secure random data (:func:`secrets.token_bytes`).
    Emits a warning via :func:`_check_stdout` if stdout is world-readable.

    :param _args: Parsed CLI namespace (unused).
    :returns: ``0`` unconditionally.
    :rtype: int
    """
    _check_stdout()
    random_data = token_bytes(32)
    preshared_key = WireguardKey(random_data)
    print(preshared_key)
    return 0


def pubkey(_args: argparse.Namespace) -> int:
    """Derive a Curve25519 public key from a private key read on stdin.

    Implements the ``wg pubkey`` subcommand.  Reads the entirety of stdin,
    interprets it as a base64-encoded private key, computes the corresponding
    public key, and prints it to stdout.

    :param _args: Parsed CLI namespace (unused).
    :returns: ``0`` unconditionally.
    :rtype: int
    """
    private_key = sys.stdin.read()
    public_key = WireguardKey(private_key).public_key()
    print(public_key)
    return 0


def strip(args: argparse.Namespace) -> int:
    """Print a configuration file stripped of ``wg-quick``-specific options.

    Implements the ``wg strip`` subcommand.  Parses the input file and
    re-serialises it using :meth:`WireguardConfig.to_wgconfig`, which omits
    directives such as ``Address``, ``DNS``, ``MTU``, ``Table``, and
    hook commands (``PreUp``, ``PostUp``, ``PreDown``, ``PostDown``).

    :param args: Parsed CLI namespace with a ``configfile`` (open file handle)
        attribute.
    :returns: ``0`` unconditionally.
    :rtype: int
    """
    config = WireguardConfig.from_wgconfig(args.configfile)
    print(config.to_wgconfig())
    return 0


def up(args: argparse.Namespace) -> int:
    """Bring up a WireGuard interface via ``wg-quick``.

    Implements the ``wg-py up`` subcommand by delegating to
    :func:`wireguard_tools.wg_quick.up`.  Creates the interface, applies
    configuration, sets addresses/routes, and runs lifecycle hooks.

    :param args: Parsed CLI namespace with an ``interface`` attribute (name
        or path to a ``.conf`` file).
    :returns: ``0`` on success, ``1`` if :class:`WgQuickError` is raised.
    :rtype: int
    """
    from .wg_quick import WgQuickError, up as wg_up

    try:
        wg_up(args.interface)
        return 0
    except WgQuickError as exc:
        print(exc, file=sys.stderr)
        return 1


def down(args: argparse.Namespace) -> int:
    """Tear down a WireGuard interface via ``wg-quick``.

    Implements the ``wg-py down`` subcommand by delegating to
    :func:`wireguard_tools.wg_quick.down`.  Runs pre-down hooks, removes DNS
    configuration, deletes routing rules and routes, destroys the interface,
    and runs post-down hooks.

    :param args: Parsed CLI namespace with an ``interface`` attribute (name
        or path to a ``.conf`` file).
    :returns: ``0`` on success, ``1`` if :class:`WgQuickError` is raised.
    :rtype: int
    """
    from .wg_quick import WgQuickError, down as wg_down

    try:
        wg_down(args.interface)
        return 0
    except WgQuickError as exc:
        print(exc, file=sys.stderr)
        return 1


def main() -> int:
    """Parse command-line arguments and dispatch to the appropriate subcommand.

    Entry point for the ``wg-py`` console script.  Builds an
    :class:`argparse.ArgumentParser` with one sub-parser per subcommand, parses
    ``sys.argv``, and invokes the handler function stored in the ``func``
    default.

    :returns: The exit code returned by the dispatched subcommand, or the
        result of printing help when no subcommand is given.
    :rtype: int
    """
    parser = argparse.ArgumentParser(prog="wg-py")
    parser.set_defaults(func=lambda _: parser.print_help())

    sub = parser.add_subparsers(title="Available subcommands")
    show_parser = sub.add_parser("show", help=show.__doc__, description=show.__doc__)
    show_parser.add_argument("show_args", nargs="*")
    show_parser.set_defaults(func=show)

    showconf_parser = sub.add_parser(
        "showconf",
        help=showconf.__doc__,
        description=showconf.__doc__,
    )
    showconf_parser.add_argument("interface")
    showconf_parser.set_defaults(func=showconf)

    set__parser = sub.add_parser("set", help=set_.__doc__, description=set_.__doc__)
    set__parser.add_argument("remaining", nargs=argparse.REMAINDER)
    set__parser.set_defaults(func=set_)

    setconf_parser = sub.add_parser(
        "setconf",
        help=setconf.__doc__,
        description=setconf.__doc__,
    )
    setconf_parser.add_argument("interface")
    setconf_parser.add_argument("configfile", type=argparse.FileType("r"))
    setconf_parser.set_defaults(func=setconf)

    addconf_parser = sub.add_parser(
        "addconf",
        help=addconf.__doc__,
        description=addconf.__doc__,
    )
    addconf_parser.add_argument("interface")
    addconf_parser.add_argument("configfile", type=argparse.FileType("r"))
    addconf_parser.set_defaults(func=addconf)

    syncconf_parser = sub.add_parser(
        "syncconf",
        help=syncconf.__doc__,
        description=syncconf.__doc__,
    )
    syncconf_parser.add_argument("interface")
    syncconf_parser.add_argument("configfile", type=argparse.FileType("r"))
    syncconf_parser.set_defaults(func=syncconf)

    genkey_parser = sub.add_parser(
        "genkey",
        help=genkey.__doc__,
        description=genkey.__doc__,
    )
    genkey_parser.set_defaults(func=genkey)

    genpsk_parser = sub.add_parser(
        "genpsk",
        help=genpsk.__doc__,
        description=genpsk.__doc__,
    )
    genpsk_parser.set_defaults(func=genpsk)

    pubkey_parser = sub.add_parser(
        "pubkey",
        help=pubkey.__doc__,
        description=pubkey.__doc__,
    )
    pubkey_parser.set_defaults(func=pubkey)

    strip_parser = sub.add_parser(
        "strip",
        help=strip.__doc__,
        description=strip.__doc__,
    )
    strip_parser.add_argument("configfile", type=argparse.FileType("r"))
    strip_parser.set_defaults(func=strip)

    # wg-quick commands
    up_parser = sub.add_parser("up", help=up.__doc__, description=up.__doc__)
    up_parser.add_argument("interface")
    up_parser.set_defaults(func=up)

    down_parser = sub.add_parser("down", help=down.__doc__, description=down.__doc__)
    down_parser.add_argument("interface")
    down_parser.set_defaults(func=down)

    args = parser.parse_args()
    result: int = args.func(args)
    return result


if __name__ == "__main__":
    sys.exit(main())
