#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

from __future__ import annotations

import os
import socket
from ipaddress import ip_address, ip_interface
from pathlib import Path

import pyroute2

from .wireguard_config import WireguardConfig, WireguardPeer
from .wireguard_key import WireguardKey

WG_UAPI_SOCKET_DIR = Path("/var/run/wireguard")


class WireguardNetlinkDevice:
    def __init__(self, interface: str) -> None:
        self.interface = interface
        self.wg = pyroute2.WireGuard()

    def close(self) -> None:
        pass

    def get_config(self) -> WireguardConfig:
        try:
            attrs = dict(self.wg.info(self.interface)[0]["attrs"])
        except pyroute2.netlink.exceptions.NetlinkError as exc:
            raise RuntimeError(f"Unable to access interface: {exc.args[1]}") from exc

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
                    peer_attrs["WGPEER_A_PRESHARED_KEY"].decode("utf-8")
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
                    for allowed_ip in peer_attrs["WGPEER_A_ALLOWEDIPS"]
                ],
                last_handshake=peer_attrs.get("WGPEER_A_LAST_HANDSHAKE_TIME", {}).get(
                    "tv_sec"
                ),
                rx_bytes=peer_attrs.get("WGPEER_A_RX_BYTES"),
                tx_bytes=peer_attrs.get("WGPEER_A_TX_BYTES"),
            )
            wgconfig.add_peer(peer)
        return wgconfig

    def set_config(self, config: WireguardConfig) -> None:
        prev = self.get_config()

        # set/update the configuration
        iface_config = config.asdict()
        peers = {peer["public_key"]: peer for peer in iface_config.pop("peers", [])}

        self.wg.set(self.interface, iface_config)

        # remove peers that are no longer in the configuration
        for key in set(prev.peers).difference(peers):
            self.wg.set(self.interface, peer=dict(public_key=key, remove=True))

        # update any changed peers
        for key in set(peers).intersection(prev.peers):
            if peers[key] != prev.peers[key]:
                peer = peers[key]
                self.wg.set(self.interface, peer=peer.asdict())

        # add any new peers
        for key in set(peers).difference(prev.peers):
            peer = peers[key]
            self.wg.set(self.interface, peer=peer.asdict())


class WireguardUAPIDevice:
    def __init__(self, uapi_path: str | os.PathLike[str]) -> None:
        self.uapi_path = Path(uapi_path)
        self.uapi_socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.uapi_socket.connect(str(Path(uapi_path).resolve()))
        self._buffer = ""

    def close(self) -> None:
        self.uapi_socket.close()

    def get_config(self) -> WireguardConfig:
        self.uapi_socket.sendall(b"get=1\n\n")
        response = self.recvmsg()

        config = WireguardConfig()
        peer = None
        for key, value in response:
            # interface
            if key == "private_key":
                config.private_key = WireguardKey(value)
            elif key == "listen_port":
                config.listen_port = int(value)
            elif key == "fwmark":
                config.fwmark = int(value)

            # peer
            elif key == "public_key":
                peer = WireguardPeer(public_key=value)
                config.add_peer(peer)
            elif key == "preshared_key":
                assert peer is not None
                peer.preshared_key = WireguardKey(value) or None
            elif key == "endpoint":
                assert peer is not None
                addr, port = value.rsplit(":", 1)
                peer.endpoint_host = ip_address(addr)
                peer.endpoint_port = int(port)
            elif key == "persistent_keepalive_interval":
                assert peer is not None
                peer.persistent_keepalive = int(value)
            elif key == "allowed_ip":
                assert peer is not None
                peer.allowed_ips.append(ip_interface(value))

            # device statistics
            elif key == "last_handshake_time_sec":
                assert peer is not None
                peer.last_handshake = int(value) * 1e0
            elif key == "last_handshake_time_nsec":
                assert peer is not None
                if peer.last_handshake is not None:
                    peer.last_handshake += int(value) * 1e-9
            elif key == "rx_bytes":
                assert peer is not None
                peer.rx_bytes = int(value)
            elif key == "tx_bytes":
                assert peer is not None
                peer.tx_bytes = int(value)

            # misc
            elif key == "protocol_version":
                version = int(value)
                if version != 1:
                    raise RuntimeError(
                        "WireguardUAPIDevice.get_config unexpected protocol {version}"
                    )
            elif key == "errno":
                errno = int(value)
                if errno != 0:
                    raise RuntimeError(
                        "WireguardUAPIDevice.get_config failed with {errno}"
                    )
        return config

    def set_config(self, wgconfig: WireguardConfig) -> None:
        uapi = ["set=1"]
        if wgconfig.private_key is not None:
            uapi.append(f"private_key={wgconfig.private_key.hex()}")
        if wgconfig.listen_port is not None:
            uapi.append(f"listen_port={wgconfig.listen_port}")
        if wgconfig.fwmark is not None:
            uapi.append(f"fwmark={wgconfig.fwmark}")

        uapi.append("replace_peers=true")
        for peer in wgconfig.peers.values():
            # should resolve hostname for endpoint here
            assert not isinstance(peer.endpoint_host, str)
            uapi.extend(
                [
                    f"public_key={peer.public_key.hex()}",
                    f"endpoint={peer.endpoint_host}:{peer.endpoint_port}",
                ]
            )
            if peer.preshared_key is not None:
                uapi.append(f"preshared_key={peer.preshared_key}")
            if peer.persistent_keepalive is not None:
                uapi.append(
                    f"persistent_keepalive_interval={peer.persistent_keepalive}"
                )

            uapi.append("replace_allowed_ips=true")
            for address in peer.allowed_ips:
                uapi.append(f"allowed_ip={address}")

        uapi.append("\n")
        self.uapi_socket.sendall("\n".join(uapi).encode())

        response = self.recvmsg()
        assert len(response) == 1 and response[0][0] == "errno"
        errno = int(response[0][1])
        if errno != 0:
            raise RuntimeError(f"WireguardUAPIDevice.set_config failed with {errno}")

    # a wireguard UAPI response message is a series of key=value lines
    # followed by an empty line
    def recvmsg(self) -> list[tuple[str, str]]:
        message = []
        while True:
            # read until we have at least a line
            while "\n" not in self._buffer:
                self._buffer += self.uapi_socket.recv(4096).decode("utf-8")
            line, self._buffer = self._buffer.split("\n", maxsplit=1)
            if not line:
                break
            key, value = line.split("=", maxsplit=1)
            message.append((key, value))
        return message


def get_wireguard_device(ifname: str) -> WireguardNetlinkDevice | WireguardUAPIDevice:
    uapi_socket_path = WG_UAPI_SOCKET_DIR.joinpath(ifname).with_suffix(".sock")

    if uapi_socket_path.exists():
        return WireguardUAPIDevice(uapi_socket_path)
    else:
        return WireguardNetlinkDevice(ifname)


def list_wireguard_devices() -> set[str]:
    with pyroute2.NDB() as ndb:
        netlink_devices = {
            nic.ifname for nic in ndb.interfaces if nic.kind == "wireguard"
        }

    uapi_devices = {
        socket_path.stem for socket_path in WG_UAPI_SOCKET_DIR.glob("*.sock")
    }
    return netlink_devices.union(uapi_devices)
