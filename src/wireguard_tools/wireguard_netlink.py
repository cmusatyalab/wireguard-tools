#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

from __future__ import annotations

from typing import Iterator

import pyroute2

from .wireguard_config import WireguardConfig, WireguardPeer
from .wireguard_device import WireguardDevice
from .wireguard_key import WireguardKey


class WireguardNetlinkDevice(WireguardDevice):
    def __init__(self, interface: str) -> None:
        super().__init__(interface)
        self.wg = pyroute2.WireGuard()

    def close(self) -> None:
        self.wg.close()

    def get_config(self) -> WireguardConfig:
        try:
            attrs = dict(self.wg.info(self.interface)[0]["attrs"])
        except pyroute2.netlink.exceptions.NetlinkError as exc:
            msg = f"Unable to access interface: {exc.args[1]}"
            raise RuntimeError(msg) from exc

        try:
            private_key = WireguardKey(attrs["WGDEVICE_A_PRIVATE_KEY"].decode("utf-8"))
        except KeyError:
            private_key = None

        wgconfig = WireguardConfig(
            private_key=private_key or None,
            fwmark=attrs["WGDEVICE_A_FWMARK"] or None,
            listen_port=attrs["WGDEVICE_A_LISTEN_PORT"] or None,
        )

        for peer_attrs in (
            dict(peer["attrs"]) for peer in attrs.get("WGDEVICE_A_PEERS", [])
        ):
            peer = WireguardPeer(
                public_key=peer_attrs["WGPEER_A_PUBLIC_KEY"].decode("utf-8"),
                preshared_key=WireguardKey(
                    peer_attrs["WGPEER_A_PRESHARED_KEY"].decode("utf-8"),
                )
                or None,
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
        current_config = self.get_config()

        # set/update the configuration
        self.wg.set(
            interface=self.interface,
            private_key=str(config.private_key) if config.private_key else None,
            listen_port=config.listen_port,
            fwmark=config.fwmark,
        )

        cur_peers = set(current_config.peers)
        new_peers = set(config.peers)

        # remove peers that are no longer in the configuration
        for key in cur_peers.difference(new_peers):
            self.wg.set(self.interface, peer={"public_key": str(key), "remove": True})

        # update any changed peers
        for key in cur_peers.intersection(new_peers):
            peer = config.peers[key]
            if peer != current_config.peers[key]:
                self.wg.set(self.interface, peer=self._wg_set_peer_arg(peer))

        # add any new peers
        for key in new_peers.difference(cur_peers):
            peer = config.peers[key]
            self.wg.set(self.interface, peer=self._wg_set_peer_arg(peer))

    def _wg_set_peer_arg(self, peer: WireguardPeer) -> dict[str, str | int | list[str]]:
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
        with pyroute2.NDB() as ndb:
            for nic in ndb.interfaces:
                if nic.kind == "wireguard":
                    yield cls(nic.ifname)
