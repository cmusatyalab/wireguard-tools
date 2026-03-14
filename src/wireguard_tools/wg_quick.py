#
# Pure Python reimplementation of wg-quick
#
# Copyright (c) 2024 Richard Dawson
# SPDX-License-Identifier: MIT
#
# Implements the core logic of the wg-quick(8) bash script using pyroute2
# for netlink-based interface, address, and route management.
#

"""Pure-Python reimplementation of ``wg-quick(8)`` interface lifecycle management.

This module provides :func:`up` and :func:`down` entry points that mirror the
behaviour of the ``wg-quick`` shell script shipped with the upstream
WireGuard tools.  Network configuration (link creation, address assignment,
routing, policy rules) is performed via Netlink using :mod:`pyroute2` rather
than shelling out to ``ip(8)``.

DNS is optionally managed through ``resolvconf(8)`` when available.  Lifecycle
hook commands (``PreUp``, ``PostUp``, ``PreDown``, ``PostDown``) are executed
via the system shell with the ``WIREGUARD_INTERFACE`` environment variable set
to the interface name.

Typical usage from the CLI layer::

    from wireguard_tools.wg_quick import up, down

    up("wg0")   # or up("/etc/wireguard/wg0.conf")
    down("wg0")
"""

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
    """Fatal error during a ``wg-quick`` lifecycle operation.

    Raised by :func:`up`, :func:`down`, and their helpers whenever an
    operation cannot be completed — for example, a missing configuration file,
    a failed hook command, or a missing network interface.  The exception
    message is intended to be displayed directly to the end-user.
    """


def _find_config(name_or_path: str) -> tuple[str, Path]:
    """Resolve an interface name or configuration file path.

    Resolution rules:

    1. If *name_or_path* has a ``.conf`` suffix **and** the file exists, it is
       treated as a direct path — the interface name is derived from the stem.
    2. Otherwise, look for ``/etc/wireguard/<name_or_path>.conf``.
    3. A :exc:`PermissionError` while checking the ``/etc/wireguard`` path is
       silently ignored (the caller will receive the "not found" error instead).

    :param name_or_path: Either a bare interface name (e.g. ``"wg0"``) or an
        absolute/relative path ending in ``.conf``.
    :returns: A ``(ifname, config_path)`` tuple.
    :rtype: tuple[str, Path]
    :raises WgQuickError: If no configuration file can be located.
    """
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
    """Execute a lifecycle hook command via the system shell.

    The command is run with ``shell=True``.  The process inherits the
    current environment augmented with ``WIREGUARD_INTERFACE`` set to
    *ifname*, matching the contract of the upstream ``wg-quick`` script.

    :param cmd: Shell command string (e.g. ``"iptables -A FORWARD ..."``).
    :param ifname: WireGuard interface name injected into the environment.
    :rtype: None
    :raises WgQuickError: If the subprocess exits with a non-zero return code.
    """
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
    """Check whether a network interface with the given name exists.

    :param ifname: Name of the network interface to look up.
    :returns: ``True`` if the interface is present, ``False`` otherwise.
    :rtype: bool
    """
    with pyroute2.IPRoute() as ipr:
        links = ipr.link_lookup(ifname=ifname)
        return len(links) > 0


def _create_interface(ifname: str) -> None:
    """Create a new WireGuard network interface via Netlink.

    The interface is created with ``kind="wireguard"`` and starts in the
    *down* state.  Callers are responsible for applying configuration and
    bringing the link up afterward.

    :param ifname: Desired interface name (e.g. ``"wg0"``).
    :rtype: None
    :raises pyroute2.netlink.exceptions.NetlinkError: If the interface
        already exists or the kernel module is unavailable.
    """
    with pyroute2.IPRoute() as ipr:
        ipr.link("add", ifname=ifname, kind="wireguard")


def _delete_interface(ifname: str) -> None:
    """Delete a network interface by name.

    If the interface does not exist the call is a silent no-op, making it safe
    to use in cleanup/rollback paths.

    :param ifname: Interface name to delete.
    :rtype: None
    """
    with pyroute2.IPRoute() as ipr:
        idx = ipr.link_lookup(ifname=ifname)
        if idx:
            ipr.link("del", index=idx[0])


def _set_link_up(ifname: str, mtu: int | None = None) -> None:
    """Bring a network interface up, optionally setting its MTU.

    :param ifname: Interface name to bring up.
    :param mtu: If not ``None``, the MTU is set atomically with the state
        change.
    :rtype: None
    :raises WgQuickError: If the interface cannot be found.
    """
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
    """Assign an IP address to a network interface.

    :param ifname: Interface name to configure.
    :param address: IPv4 or IPv6 interface address including prefix length
        (e.g. ``IPv4Interface("10.0.0.1/24")``).
    :rtype: None
    :raises WgQuickError: If the interface cannot be found.
    """
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
    """Add a route for *dest* via the named interface.

    If the route already exists (``EEXIST`` / errno 17) the error is silently
    ignored, making this call idempotent.

    :param ifname: Outgoing interface name.
    :param dest: Destination network (e.g. ``IPv4Network("10.0.0.0/24")``).
    :param table: Routing table number.  ``None`` means the main table.
    :rtype: None
    :raises WgQuickError: If the interface cannot be found.
    :raises pyroute2.netlink.exceptions.NetlinkError: For Netlink errors other
        than ``EEXIST``.
    """
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
    """Remove a route for *dest* via the named interface.

    All Netlink errors are silently suppressed so this function is safe to call
    during teardown even when the route has already been removed.  If the
    interface no longer exists the call is a no-op.

    :param ifname: Outgoing interface name.
    :param dest: Destination network to remove.
    :param table: Routing table number.  ``None`` means the main table.
    :rtype: None
    """
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
    """Add an ``ip rule`` for fwmark-based routing.

    Required when catch-all (``0.0.0.0/0`` or ``::/0``) AllowedIPs are
    present so that traffic *from* the WireGuard tunnel itself (already
    marked with *fwmark*) is directed to the correct routing table and does
    not loop back into the tunnel.  The rule is installed at priority 32764.

    If the rule already exists (``EEXIST``) the error is silently ignored.

    :param fwmark: Firewall mark value to match.
    :param table: Routing table to direct matching packets to.
    :param family: Address family (``socket.AF_INET`` or ``socket.AF_INET6``).
    :rtype: None
    :raises pyroute2.netlink.exceptions.NetlinkError: For Netlink errors other
        than ``EEXIST``.
    """
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
    """Remove the fwmark-based routing rule created by :func:`_add_fwmark_rule`.

    All Netlink errors are silently suppressed so this is safe to call during
    teardown even when the rule has already been removed.

    :param fwmark: Firewall mark value to match.
    :param table: Routing table that was used when the rule was created.
    :param family: Address family (``socket.AF_INET`` or ``socket.AF_INET6``).
    :rtype: None
    """
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
    """Add a suppress-prefixlength rule to prevent routing loops.

    When a catch-all (``0.0.0.0/0`` or ``::/0``) route is installed in a
    non-main routing table, the main table's default route would normally
    still match.  This rule (priority 32765) tells the kernel to *skip* the
    main table lookup when the matching route has a prefix length of 0,
    ensuring that only more-specific routes from the main table are used.

    If the rule already exists (``EEXIST``) the error is silently ignored.

    :param table: Routing table number (unused directly — the rule always
        targets table 254 / main).
    :param family: Address family (``socket.AF_INET`` or ``socket.AF_INET6``).
    :rtype: None
    :raises pyroute2.netlink.exceptions.NetlinkError: For Netlink errors other
        than ``EEXIST``.
    """
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
    """Remove the suppress-prefixlength rule created by :func:`_add_suppress_prefix_rule`.

    All Netlink errors are silently suppressed so this is safe to call during
    teardown even when the rule has already been removed.

    :param family: Address family (``socket.AF_INET`` or ``socket.AF_INET6``).
    :rtype: None
    """
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
    """Resolve the ``Table`` configuration directive to a routing table number.

    Behaviour:

    * ``"off"`` — return ``None``.  No route management is performed and all
      routes must be managed externally.
    * ``"auto"`` (the default when ``Table`` is absent) — if *any* peer has a
      catch-all AllowedIP (``0.0.0.0/0`` or ``::/0``), the interface's own
      kernel index is used as the routing table number (enabling policy-based
      routing with fwmark rules).  When there is no catch-all, ``None`` is
      returned and routes are added to the main table.
    * An explicit numeric string — parsed and returned as an ``int``.

    :param config: The parsed WireGuard configuration.
    :param ifname: The interface name (used to look up the kernel interface
        index in the ``"auto"`` case).
    :returns: A routing table number, or ``None`` when routes should go into
        the main table or route management is disabled.
    :rtype: int | None
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
    """Collect deduplicated AllowedIPs networks across all peers.

    Iterates every peer's ``allowed_ips`` and returns the distinct *network*
    portion of each entry in first-seen order.  Deduplication is based on the
    string representation of the network, so ``10.0.0.0/24`` appearing in two
    peers is returned only once.

    :param config: The parsed WireGuard configuration.
    :returns: An ordered list of unique networks.
    :rtype: list[IPv4Network | IPv6Network]
    """
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
    """Configure DNS servers and search domains via ``resolvconf(8)``.

    If the configuration contains ``DNS`` or ``SearchDomain`` entries and
    ``resolvconf`` is found on ``$PATH``, its ``-a`` subcommand is invoked
    with metric ``0`` and exclusive mode (``-x``) to register name-servers
    under the ``tun.<ifname>`` scope.

    When ``resolvconf`` is not installed a warning is printed to stderr and
    no DNS changes are made.

    :param config: The parsed WireGuard configuration (supplies
        :attr:`dns_servers` and :attr:`search_domains`).
    :param ifname: Interface name used as the ``resolvconf`` scope identifier.
    :returns: ``True`` if DNS was successfully configured, ``False`` otherwise
        (including when no DNS settings are present).
    :rtype: bool
    """
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
    """Remove DNS configuration previously registered by :func:`_setup_dns`.

    Calls ``resolvconf -d tun.<ifname>`` to unregister the scope.  If
    ``resolvconf`` is not installed the call is a silent no-op.

    :param ifname: Interface name whose DNS scope should be removed.
    :rtype: None
    """
    resolvconf = _which("resolvconf")
    if resolvconf is not None:
        subprocess.run(
            [resolvconf, "-d", f"tun.{ifname}"],
            check=False,
        )


def _which(cmd: str) -> str | None:
    """Locate an executable on ``$PATH``.

    Thin wrapper around :func:`shutil.which` extracted for test-time
    monkey-patching.

    :param cmd: Executable name to search for.
    :returns: Absolute path to the executable, or ``None`` if not found.
    :rtype: str | None
    """
    import shutil
    return shutil.which(cmd)


def up(name_or_path: str) -> None:
    """Bring up a WireGuard interface (equivalent to ``wg-quick up``).

    Full lifecycle:

    1. Resolve the configuration file via :func:`_find_config`.
    2. Verify the interface does not already exist.
    3. Execute ``PreUp`` hook commands.
    4. Create the WireGuard network interface.
    5. Apply cryptographic and peer configuration via
       :meth:`~wireguard_tools.wireguard_device.WireguardDevice.set_config`.
    6. Assign ``Address`` entries to the interface.
    7. Set MTU (from config or :data:`DEFAULT_MTU_V4`) and bring the link up.
    8. Resolve routing table (see :func:`_resolve_table`), install routes for
       every unique AllowedIP network, and — when catch-all routes are present
       — add fwmark and suppress-prefixlength policy rules.
    9. Configure DNS via :func:`_setup_dns`.
    10. Execute ``PostUp`` hook commands.

    **Rollback on failure:** if any step after interface creation raises an
    exception, the interface is deleted before the exception propagates,
    preventing a half-configured interface from lingering.

    :param name_or_path: Interface name (e.g. ``"wg0"``) or path to a
        ``.conf`` file.
    :rtype: None
    :raises WgQuickError: If the interface already exists, the configuration
        file is missing, or any sub-step fails.
    """
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
        with open(config_path) as f:
            wg_config = WireguardConfig.from_wgconfig(f)
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
    """Tear down a WireGuard interface (equivalent to ``wg-quick down``).

    Full lifecycle:

    1. Resolve the configuration file via :func:`_find_config`.
    2. Verify the interface currently exists.
    3. Execute ``PreDown`` hook commands.
    4. Remove DNS configuration via :func:`_teardown_dns`.
    5. If catch-all AllowedIPs are present, remove the fwmark and
       suppress-prefixlength policy rules.
    6. Remove all routes that were installed for AllowedIP networks.
    7. Delete the WireGuard network interface (which also implicitly removes
       associated addresses).
    8. Execute ``PostDown`` hook commands.

    Unlike :func:`up`, there is no rollback — each teardown step is
    best-effort and proceeds to the next even if an individual step fails
    (e.g. a route was already removed externally).

    :param name_or_path: Interface name (e.g. ``"wg0"``) or path to a
        ``.conf`` file.
    :rtype: None
    :raises WgQuickError: If the interface is not currently up or the
        configuration file is missing.
    """
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
