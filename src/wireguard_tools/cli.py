#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

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


def _format_endpoint(peer: WireguardPeer) -> str:
    if peer.endpoint_host is None:
        return "(none)"
    host = peer.endpoint_host
    if isinstance(host, IPv6Address):
        return f"[{host}]:{peer.endpoint_port}"
    return f"{host}:{peer.endpoint_port}"


def _show_pretty(
    device: WireguardDevice, config: WireguardConfig, hide_keys: bool
) -> None:
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
    """Resolve `wg show` positional arguments into (interface, field)."""
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
    """Show the current configuration and device information."""
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
    """Show the configuration of a WireGuard interface, for use with `setconf`."""
    try:
        with closing(WireguardDevice.get(args.interface)) as device:
            config = device.get_config()
            print(config.to_wgconfig(), end="")
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def _read_key_file(path: str) -> WireguardKey | None:
    """Read a key from a file path. Returns None for /dev/null or empty files."""
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
    """Parse the ``wg set`` argument syntax.

    Returns (interface, iface_params, peers).
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
    """Change the current configuration, add peers, remove peers, or change peers."""
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
                config.fwmark = iface_params["fwmark"] or None

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
    """Apply a configuration file to a WireGuard interface."""
    try:
        config = WireguardConfig.from_wgconfig(args.configfile)
        with closing(WireguardDevice.get(args.interface)) as device:
            device.set_config(config)
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def addconf(args: argparse.Namespace) -> int:
    """Append a configuration file to a WireGuard interface."""
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
    """Synchronize a configuration file with a WireGuard interface."""
    try:
        config = WireguardConfig.from_wgconfig(args.configfile)
        with closing(WireguardDevice.get(args.interface)) as device:
            device.sync_config(config)
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def _check_stdout() -> None:
    """Check and warn if stdout is a world accessible file."""
    stat = os.fstat(sys.stdout.fileno())
    if S_ISREG(stat.st_mode) and (stat.st_mode & S_IRWXO):
        print("Warning: writing to world accessible file.", file=sys.stderr)


def genkey(_args: argparse.Namespace) -> int:
    """Generate a new private key and write it to stdout."""
    _check_stdout()
    secret_key = WireguardKey.generate()
    print(secret_key)
    return 0


def genpsk(_args: argparse.Namespace) -> int:
    """Generate a new preshared key and write it to stdout."""
    _check_stdout()
    random_data = token_bytes(32)
    preshared_key = WireguardKey(random_data)
    print(preshared_key)
    return 0


def pubkey(_args: argparse.Namespace) -> int:
    """Read a private key from stdin and write a public key to stdout."""
    private_key = sys.stdin.read()
    public_key = WireguardKey(private_key).public_key()
    print(public_key)
    return 0


def strip(args: argparse.Namespace) -> int:
    """Output a configuration file with all wg-quick specific options removed."""
    config = WireguardConfig.from_wgconfig(args.configfile)
    print(config.to_wgconfig())
    return 0


def up(args: argparse.Namespace) -> int:
    """Create and configure a WireGuard interface from a config file."""
    from .wg_quick import WgQuickError, up as wg_up

    try:
        wg_up(args.interface)
        return 0
    except WgQuickError as exc:
        print(exc, file=sys.stderr)
        return 1


def down(args: argparse.Namespace) -> int:
    """Tear down a WireGuard interface."""
    from .wg_quick import WgQuickError, down as wg_down

    try:
        wg_down(args.interface)
        return 0
    except WgQuickError as exc:
        print(exc, file=sys.stderr)
        return 1


def main() -> int:
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
