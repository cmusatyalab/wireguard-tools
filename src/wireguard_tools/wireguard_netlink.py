#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

"""Linux Netlink backend for managing WireGuard devices.

This module provides :class:`WireguardNetlinkDevice`, a
:class:`~wireguard_tools.wireguard_device.WireguardDevice` implementation
that communicates with the WireGuard kernel module through the Netlink
socket interface via `pyroute2 <https://pyroute2.org/>`_.

.. note::

   Netlink operations typically require ``CAP_NET_ADMIN`` privileges.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any, Iterator

import pyroute2

from .wireguard_config import WireguardConfig, WireguardPeer
from .wireguard_device import WireguardDevice
from .wireguard_key import WireguardKey


class WireguardNetlinkDevice(WireguardDevice):
    """WireGuard device backed by Linux Netlink (pyroute2).

    Manages the lifecycle of a :class:`pyroute2.WireGuard` handle used
    for all get/set operations on the named interface.  Callers should
    invoke :meth:`close` (or use the device as a context manager via the
    base class) when finished to release the Netlink socket.

    :param interface: Name of the WireGuard network interface
        (e.g. ``"wg0"``).
    """

    def __init__(self, interface: str) -> None:
        super().__init__(interface)
        self.wg = pyroute2.WireGuard()

    def close(self) -> None:
        """Close the underlying Netlink socket.

        After this call, further operations on this device will fail.
        """
        self.wg.close()

    def get_config(self) -> WireguardConfig:
        """Retrieve the current WireGuard configuration from the kernel.

        Queries the Netlink interface for private key, listen port, fwmark,
        and all peer state including allowed IPs, endpoint, handshake time,
        and transfer statistics.

        :returns: Snapshot of the running interface configuration.
        :rtype: WireguardConfig
        :raises RuntimeError: If the interface cannot be accessed (e.g. it
            does not exist or the caller lacks privileges).
        """
        try:
            info = self.wg.info(self.interface)
            attrs = dict(info[0]["attrs"])
        except pyroute2.netlink.exceptions.NetlinkError as exc:
            msg = f"Unable to access interface: {exc.args[1]}"
            raise RuntimeError(msg) from exc

        try:
            private_key = WireguardKey(attrs["WGDEVICE_A_PRIVATE_KEY"].decode("utf-8"))
        except KeyError:
            private_key = None

        wgconfig = WireguardConfig(
            private_key=private_key,
            fwmark=attrs["WGDEVICE_A_FWMARK"] or None,
            listen_port=attrs["WGDEVICE_A_LISTEN_PORT"] or None,
        )

        peer_attrs_by_pubkey: defaultdict[bytes, dict[str, Any]] = defaultdict(dict)

        for peer_attrs in (
            dict(peer["attrs"])
            for part in info
            for peer in part.get("WGDEVICE_A_PEERS", [])
        ):
            peer_attrs_by_pubkey[peer_attrs["WGPEER_A_PUBLIC_KEY"]].update(peer_attrs)

        for peer_attrs in peer_attrs_by_pubkey.values():
            preshared_key = peer_attrs["WGPEER_A_PRESHARED_KEY"].decode("utf-8")
            peer = WireguardPeer(
                public_key=peer_attrs["WGPEER_A_PUBLIC_KEY"].decode("utf-8"),
                preshared_key=WireguardKey(preshared_key) if preshared_key else None,
                endpoint_host=peer_attrs.get("WGPEER_A_ENDPOINT", {}).get("addr"),
                endpoint_port=peer_attrs.get("WGPEER_A_ENDPOINT", {}).get("port"),
                persistent_keepalive=peer_attrs[
                    "WGPEER_A_PERSISTENT_KEEPALIVE_INTERVAL"
                ]
                or None,
                allowed_ips=[
                    allowed_ip["addr"]
                    for allowed_ip in peer_attrs.get("WGPEER_A_ALLOWEDIPS", [])
                ],
                last_handshake=peer_attrs.get("WGPEER_A_LAST_HANDSHAKE_TIME", {}).get(
                    "tv_sec",
                ),
                rx_bytes=peer_attrs.get("WGPEER_A_RX_BYTES"),
                tx_bytes=peer_attrs.get("WGPEER_A_TX_BYTES"),
            )
            wgconfig.add_peer(peer)
        return wgconfig

    def set_config(self, config: WireguardConfig) -> None:
        """Replace the interface configuration via Netlink.

        Delegates to :meth:`_apply_config`, which diffs against the current
        running state, removes stale peers, and updates or adds new ones.

        :param config: Desired configuration to apply.
        """
        self._apply_config(config)

    def sync_config(self, config: WireguardConfig) -> None:
        """Synchronise the interface configuration via Netlink.

        Functionally equivalent to :meth:`set_config` for the Netlink
        backend — both diff against the running state before applying
        changes.

        :param config: Desired configuration to synchronise.
        """
        self._apply_config(config)

    def _apply_config(self, config: WireguardConfig) -> None:
        """Diff the desired configuration against running state and apply changes.

        Reads the current device configuration, then:

        1. Sets interface-level parameters (private key, listen port, fwmark).
        2. Removes peers present in the current config but absent from *config*.
        3. Updates peers whose settings have changed.
        4. Adds peers that are new in *config*.

        :param config: Desired full interface configuration.
        """
        current_config = self.get_config()

        self.wg.set(
            interface=self.interface,
            private_key=str(config.private_key) if config.private_key else None,
            listen_port=config.listen_port,
            fwmark=config.fwmark,
        )

        cur_peers = set(current_config.peers)
        new_peers = set(config.peers)

        for key in cur_peers.difference(new_peers):
            self.wg.set(self.interface, peer={"public_key": str(key), "remove": True})

        for key in cur_peers.intersection(new_peers):
            peer = config.peers[key]
            if peer != current_config.peers[key]:
                self.wg.set(self.interface, peer=self._wg_set_peer_arg(peer))

        for key in new_peers.difference(cur_peers):
            peer = config.peers[key]
            self.wg.set(self.interface, peer=self._wg_set_peer_arg(peer))

    def _wg_set_peer_arg(self, peer: WireguardPeer) -> dict[str, str | int | list[str]]:
        """Build a pyroute2-compatible peer argument dictionary.

        Translates a :class:`~wireguard_tools.wireguard_config.WireguardPeer`
        into the dictionary format expected by :meth:`pyroute2.WireGuard.set`.

        :param peer: Peer whose attributes are to be serialised.
        :returns: Dictionary suitable for the ``peer`` keyword of
            :meth:`pyroute2.WireGuard.set`.
        :rtype: dict[str, str | int | list[str]]
        """
        peer_dict: dict[str, str | int | list[str]] = {
            "public_key": str(peer.public_key),
        }
        if peer.endpoint_host is not None and peer.endpoint_port is not None:
            peer_dict["endpoint_addr"] = str(peer.endpoint_host)
            peer_dict["endpoint_port"] = peer.endpoint_port
        if peer.preshared_key is not None:
            peer_dict["preshared_key"] = str(peer.preshared_key)
        if peer.persistent_keepalive is not None:
            peer_dict["persistent_keepalive"] = peer.persistent_keepalive
        peer_dict["allowed_ips"] = [str(addr) for addr in peer.allowed_ips]
        return peer_dict

    @classmethod
    def list(cls) -> Iterator[WireguardNetlinkDevice]:
        """Yield all WireGuard interfaces discovered via Netlink.

        Uses :class:`pyroute2.NDB` to enumerate network interfaces and
        filters for those with ``kind == "wireguard"``.

        :returns: Iterator of :class:`WireguardNetlinkDevice` instances.
        :rtype: Iterator[WireguardNetlinkDevice]
        """
        with pyroute2.NDB() as ndb:
            for nic in ndb.interfaces:
                if nic.kind == "wireguard":
                    yield cls(nic.ifname)
