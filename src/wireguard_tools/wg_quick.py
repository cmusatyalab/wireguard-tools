#
# Pure Python reimplementation of wg-quick
#
# Copyright (c) 2024 Richard Dawson
# SPDX-License-Identifier: MIT
#
# Implements the core logic of the wg-quick(8) bash script using pyroute2
# for netlink-based interface, address, and route management.
#

from __future__ import annotations

import os
import subprocess
import sys
from contextlib import closing
from ipaddress import IPv4Network, IPv6Network, ip_interface, ip_network
from pathlib import Path
from typing import TYPE_CHECKING

import pyroute2

from .wireguard_config import WireguardConfig
from .wireguard_device import WireguardDevice

if TYPE_CHECKING:
    from ipaddress import IPv4Interface, IPv6Interface

WG_CONFIG_DIR = Path("/etc/wireguard")
DEFAULT_TABLE = "auto"
DEFAULT_MTU_V4 = 1420
DEFAULT_MTU_V6 = 1420


class WgQuickError(RuntimeError):
    """Raised when a wg-quick operation fails."""


def _find_config(name_or_path: str) -> tuple[str, Path]:
    """Resolve an interface name or config path to (ifname, config_path)."""
    p = Path(name_or_path)
    if p.suffix == ".conf" and p.exists():
        return p.stem, p
    config_path = WG_CONFIG_DIR / f"{name_or_path}.conf"
    try:
        if config_path.exists():
            return name_or_path, config_path
    except PermissionError:
        pass
    msg = f"Configuration file not found for '{name_or_path}'"
    raise WgQuickError(msg)


def _run_hook(cmd: str, ifname: str) -> None:
    """Run a PreUp/PostUp/PreDown/PostDown hook command."""
    env = os.environ.copy()
    env["WIREGUARD_INTERFACE"] = ifname
    result = subprocess.run(
        cmd,
        shell=True,  # noqa: S602 -- hooks are inherently shell commands
        env=env,
        check=False,
    )
    if result.returncode != 0:
        msg = f"Hook command failed (exit {result.returncode}): {cmd}"
        raise WgQuickError(msg)


def _interface_exists(ifname: str) -> bool:
    with pyroute2.IPRoute() as ipr:
        links = ipr.link_lookup(ifname=ifname)
        return len(links) > 0


def _create_interface(ifname: str) -> None:
    with pyroute2.IPRoute() as ipr:
        ipr.link("add", ifname=ifname, kind="wireguard")


def _delete_interface(ifname: str) -> None:
    with pyroute2.IPRoute() as ipr:
        idx = ipr.link_lookup(ifname=ifname)
        if idx:
            ipr.link("del", index=idx[0])


def _set_link_up(ifname: str, mtu: int | None = None) -> None:
    with pyroute2.IPRoute() as ipr:
        idx = ipr.link_lookup(ifname=ifname)
        if not idx:
            msg = f"Interface {ifname} not found"
            raise WgQuickError(msg)
        kwargs: dict[str, object] = {"index": idx[0], "state": "up"}
        if mtu is not None:
            kwargs["mtu"] = mtu
        ipr.link("set", **kwargs)


def _add_address(
    ifname: str, address: IPv4Interface | IPv6Interface
) -> None:
    with pyroute2.IPRoute() as ipr:
        idx = ipr.link_lookup(ifname=ifname)
        if not idx:
            msg = f"Interface {ifname} not found"
            raise WgQuickError(msg)
        ipr.addr(
            "add",
            index=idx[0],
            address=str(address.ip),
            prefixlen=address.network.prefixlen,
        )


def _add_route(
    ifname: str,
    dest: IPv4Network | IPv6Network,
    *,
    table: int | None = None,
) -> None:
    with pyroute2.IPRoute() as ipr:
        idx = ipr.link_lookup(ifname=ifname)
        if not idx:
            msg = f"Interface {ifname} not found"
            raise WgQuickError(msg)
        kwargs: dict[str, object] = {
            "dst": str(dest),
            "oif": idx[0],
        }
        if table is not None:
            kwargs["table"] = table
        try:
            ipr.route("add", **kwargs)
        except pyroute2.netlink.exceptions.NetlinkError as exc:
            if exc.code != 17:  # EEXIST
                raise


def _del_route(
    ifname: str,
    dest: IPv4Network | IPv6Network,
    *,
    table: int | None = None,
) -> None:
    with pyroute2.IPRoute() as ipr:
        idx = ipr.link_lookup(ifname=ifname)
        if not idx:
            return
        kwargs: dict[str, object] = {
            "dst": str(dest),
            "oif": idx[0],
        }
        if table is not None:
            kwargs["table"] = table
        try:
            ipr.route("del", **kwargs)
        except pyroute2.netlink.exceptions.NetlinkError:
            pass


def _add_fwmark_rule(fwmark: int, table: int, family: int) -> None:
    """Add an ip rule for fwmark-based routing (needed for catch-all AllowedIPs)."""
    with pyroute2.IPRoute() as ipr:
        try:
            ipr.rule(
                "add",
                family=family,
                fwmark=fwmark,
                lookup=table,
                priority=32764,
            )
        except pyroute2.netlink.exceptions.NetlinkError as exc:
            if exc.code != 17:
                raise


def _del_fwmark_rule(fwmark: int, table: int, family: int) -> None:
    with pyroute2.IPRoute() as ipr:
        try:
            ipr.rule(
                "del",
                family=family,
                fwmark=fwmark,
                lookup=table,
                priority=32764,
            )
        except pyroute2.netlink.exceptions.NetlinkError:
            pass


def _add_suppress_prefix_rule(table: int, family: int) -> None:
    """Suppress prefix-length 0 routes for the main table to avoid routing loops."""
    with pyroute2.IPRoute() as ipr:
        try:
            ipr.rule(
                "add",
                family=family,
                lookup=254,  # main table
                suppress_prefixlength=0,
                priority=32765,
            )
        except pyroute2.netlink.exceptions.NetlinkError as exc:
            if exc.code != 17:
                raise


def _del_suppress_prefix_rule(family: int) -> None:
    with pyroute2.IPRoute() as ipr:
        try:
            ipr.rule(
                "del",
                family=family,
                lookup=254,
                suppress_prefixlength=0,
                priority=32765,
            )
        except pyroute2.netlink.exceptions.NetlinkError:
            pass


def _resolve_table(config: WireguardConfig, ifname: str) -> int | None:
    """Resolve the Table config value to a routing table number.

    - "off": return None (no route management)
    - "auto" (default): use interface index as table number when catch-all
      AllowedIPs are present, otherwise use the main table
    - numeric: return the explicit table number
    """
    table_str = config.table or DEFAULT_TABLE
    if table_str == "off":
        return None
    if table_str == "auto":
        has_catchall = False
        for peer in config.peers.values():
            for aip in peer.allowed_ips:
                if aip.network.prefixlen == 0:
                    has_catchall = True
                    break
        if has_catchall:
            with pyroute2.IPRoute() as ipr:
                idx = ipr.link_lookup(ifname=ifname)
                return idx[0] if idx else None
        return None  # use main table (no explicit table arg)
    return int(table_str)


def _collect_allowed_networks(
    config: WireguardConfig,
) -> list[IPv4Network | IPv6Network]:
    """Collect unique AllowedIPs networks across all peers."""
    seen: set[str] = set()
    networks: list[IPv4Network | IPv6Network] = []
    for peer in config.peers.values():
        for aip in peer.allowed_ips:
            net = aip.network
            key = str(net)
            if key not in seen:
                seen.add(key)
                networks.append(net)
    return networks


def _setup_dns(config: WireguardConfig, ifname: str) -> bool:
    """Set up DNS using resolvconf if available. Returns True if DNS was set."""
    if not config.dns_servers and not config.search_domains:
        return False
    resolvconf = _which("resolvconf")
    if resolvconf is None:
        print(
            "Warning: resolvconf not found, DNS settings will not be applied.",
            file=sys.stderr,
        )
        return False
    resolvconf_input = config.to_resolvconf()
    result = subprocess.run(
        [resolvconf, "-a", f"tun.{ifname}", "-m", "0", "-x"],
        input=resolvconf_input,
        text=True,
        check=False,
    )
    return result.returncode == 0


def _teardown_dns(ifname: str) -> None:
    resolvconf = _which("resolvconf")
    if resolvconf is not None:
        subprocess.run(
            [resolvconf, "-d", f"tun.{ifname}"],
            check=False,
        )


def _which(cmd: str) -> str | None:
    import shutil
    return shutil.which(cmd)


def up(name_or_path: str) -> None:
    """Bring up a WireGuard interface (equivalent to ``wg-quick up``)."""
    ifname, config_path = _find_config(name_or_path)

    if _interface_exists(ifname):
        msg = f"Interface {ifname} already exists"
        raise WgQuickError(msg)

    with open(config_path) as f:
        config = WireguardConfig.from_wgconfig(f)

    # PreUp hooks
    for cmd in config.preup:
        _run_hook(cmd, ifname)

    # Create the WireGuard interface
    _create_interface(ifname)

    try:
        # Apply WireGuard configuration (keys, peers, etc.)
        wg_config = WireguardConfig.from_wgconfig(open(config_path))
        with closing(WireguardDevice.get(ifname)) as device:
            device.set_config(wg_config)

        # Set addresses
        for addr in config.addresses:
            _add_address(ifname, addr)

        # Determine MTU
        mtu = config.mtu or DEFAULT_MTU_V4
        _set_link_up(ifname, mtu=mtu)

        # Routing
        table = _resolve_table(config, ifname)
        networks = _collect_allowed_networks(config)

        has_catchall_v4 = any(
            isinstance(n, IPv4Network) and n.prefixlen == 0 for n in networks
        )
        has_catchall_v6 = any(
            isinstance(n, IPv6Network) and n.prefixlen == 0 for n in networks
        )

        for net in networks:
            _add_route(ifname, net, table=table)

        # If using fwmark-based routing (auto table with catch-all), set up rules
        if table is not None and (has_catchall_v4 or has_catchall_v6):
            fwmark = config.fwmark or 51820
            if has_catchall_v4:
                import socket
                _add_fwmark_rule(fwmark, table, socket.AF_INET)
                _add_suppress_prefix_rule(table, socket.AF_INET)
            if has_catchall_v6:
                import socket
                _add_fwmark_rule(fwmark, table, socket.AF_INET6)
                _add_suppress_prefix_rule(table, socket.AF_INET6)

        # DNS
        _setup_dns(config, ifname)

        # PostUp hooks
        for cmd in config.postup:
            _run_hook(cmd, ifname)

    except Exception:
        # If anything fails after interface creation, clean up
        _delete_interface(ifname)
        raise


def down(name_or_path: str) -> None:
    """Bring down a WireGuard interface (equivalent to ``wg-quick down``)."""
    ifname, config_path = _find_config(name_or_path)

    if not _interface_exists(ifname):
        msg = f"Interface {ifname} is not currently up"
        raise WgQuickError(msg)

    with open(config_path) as f:
        config = WireguardConfig.from_wgconfig(f)

    # PreDown hooks
    for cmd in config.predown:
        _run_hook(cmd, ifname)

    # Tear down DNS
    _teardown_dns(ifname)

    # Remove fwmark rules if they were set
    table = _resolve_table(config, ifname)
    networks = _collect_allowed_networks(config)
    has_catchall_v4 = any(
        isinstance(n, IPv4Network) and n.prefixlen == 0 for n in networks
    )
    has_catchall_v6 = any(
        isinstance(n, IPv6Network) and n.prefixlen == 0 for n in networks
    )

    if table is not None and (has_catchall_v4 or has_catchall_v6):
        fwmark = config.fwmark or 51820
        import socket
        if has_catchall_v4:
            _del_fwmark_rule(fwmark, table, socket.AF_INET)
            _del_suppress_prefix_rule(socket.AF_INET)
        if has_catchall_v6:
            _del_fwmark_rule(fwmark, table, socket.AF_INET6)
            _del_suppress_prefix_rule(socket.AF_INET6)

    # Remove routes
    for net in networks:
        _del_route(ifname, net, table=table)

    # Delete the interface (this also removes addresses)
    _delete_interface(ifname)

    # PostDown hooks
    for cmd in config.postdown:
        _run_hook(cmd, ifname)
