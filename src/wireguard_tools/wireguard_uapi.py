#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

from __future__ import annotations

import socket
from ipaddress import ip_address, ip_interface
from pathlib import Path
from typing import TYPE_CHECKING, Iterator

from .wireguard_config import WireguardConfig, WireguardPeer
from .wireguard_device import WireguardDevice
from .wireguard_key import WireguardKey

if TYPE_CHECKING:
    import os

WG_UAPI_SOCKET_DIR = Path("/var/run/wireguard")


class WireguardUAPIDevice(WireguardDevice):
    def __init__(self, uapi_path: str | os.PathLike[str]) -> None:
        self.uapi_path = (
            WG_UAPI_SOCKET_DIR.joinpath(uapi_path).with_suffix(".sock")
            if isinstance(uapi_path, str)
            else Path(uapi_path)
        )
        if not self.uapi_path.exists():
            msg = f"Unable to access interface: {uapi_path} not found."
            raise FileNotFoundError(msg)

        super().__init__(self.uapi_path.stem)

        self.uapi_socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.uapi_socket.connect(str(self.uapi_path.resolve()))
        self._buffer = ""

    def close(self) -> None:
        self.uapi_socket.close()

    def get_config(self) -> WireguardConfig:
        self.uapi_socket.sendall(b"get=1\n\n")
        response = self._recvmsg()

        config = WireguardConfig()
        peer = None
        for key, value in response:
            # interface
            if key == "private_key":
                config.private_key = WireguardKey(value)
            elif key in ["listen_port", "fwmark"]:
                setattr(config, key, int(value))

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
                peer.endpoint_host = ip_address(addr.lstrip("[").rstrip("]"))
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
            elif key in ["rx_bytes", "tx_bytes"]:
                assert peer is not None
                setattr(peer, key, int(value))

            # misc
            elif key == "protocol_version":
                version = int(value)
                if version != 1:
                    msg = (
                        f"WireguardUAPIDevice.get_config unexpected protocol {version}"
                    )
                    raise RuntimeError(msg)
            elif key == "errno":
                errno = int(value)
                if errno != 0:
                    msg = f"WireguardUAPIDevice.get_config failed with {errno}"
                    raise RuntimeError(msg)
        return config

    def set_config(self, config: WireguardConfig) -> None:
        uapi = ["set=1"]
        if config.private_key is not None:
            uapi.append(f"private_key={config.private_key.hex}")
        if config.listen_port is not None:
            uapi.append(f"listen_port={config.listen_port}")
        if config.fwmark is not None:
            uapi.append(f"fwmark={config.fwmark}")

        uapi.append("replace_peers=true")
        for peer in config.peers.values():
            # should resolve hostname for endpoint here
            assert not isinstance(peer.endpoint_host, str)
            uapi.extend(
                [
                    f"public_key={peer.public_key.hex}",
                    f"endpoint={peer.endpoint_host}:{peer.endpoint_port}",
                ],
            )
            if peer.preshared_key is not None:
                uapi.append(f"preshared_key={peer.preshared_key}")
            if peer.persistent_keepalive is not None:
                uapi.append(
                    f"persistent_keepalive_interval={peer.persistent_keepalive}",
                )

            uapi.append("replace_allowed_ips=true")
            uapi.extend([f"allowed_ip={address}" for address in peer.allowed_ips])

        uapi.append("\n")
        self.uapi_socket.sendall("\n".join(uapi).encode())

        response = self._recvmsg()
        assert len(response) == 1
        assert response[0][0] == "errno"
        errno = int(response[0][1])
        if errno != 0:
            msg = f"WireguardUAPIDevice.set_config failed with {errno}"
            raise RuntimeError(msg)

    # a wireguard UAPI response message is a series of key=value lines
    # followed by an empty line
    def _recvmsg(self) -> list[tuple[str, str]]:
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

    @classmethod
    def list(cls) -> Iterator[WireguardUAPIDevice]:
        for socket_path in WG_UAPI_SOCKET_DIR.glob("*.sock"):
            yield cls(socket_path.stem)
