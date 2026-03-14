#
# WireGuard Daemon Client -- IPC over a Unix socket
#
# Copyright (c) 2024 Richard Dawson
# SPDX-License-Identifier: MIT
#

from __future__ import annotations

import json
import os
import socket
from typing import Any

DEFAULT_SOCKET_PATH = "/var/run/wg-daemon.sock"


class DaemonError(RuntimeError):
    """Raised when the daemon returns an error response."""


class WgDaemonClient:
    """Thin client for the wg-daemon Unix socket protocol.

    Each method connects, sends a single JSON request, reads the JSON
    response, and disconnects.  This keeps the protocol stateless and
    avoids holding sockets open.
    """

    def __init__(
        self,
        socket_path: str | None = None,
    ) -> None:
        self.socket_path = (
            socket_path
            or os.environ.get("WG_DAEMON_SOCKET")
            or DEFAULT_SOCKET_PATH
        )

    def _request(self, cmd: str, args: dict[str, Any] | None = None) -> Any:
        """Send *cmd* with *args* and return the ``data`` field on success."""
        payload = {"cmd": cmd, "args": args or {}}
        raw = json.dumps(payload) + "\n"

        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        try:
            sock.connect(self.socket_path)
            sock.sendall(raw.encode("utf-8"))
            sock.shutdown(socket.SHUT_WR)

            chunks: list[bytes] = []
            while True:
                chunk = sock.recv(65536)
                if not chunk:
                    break
                chunks.append(chunk)
        finally:
            sock.close()

        response = json.loads(b"".join(chunks).decode("utf-8"))
        if not response.get("ok"):
            raise DaemonError(response.get("error", "Unknown daemon error"))
        return response.get("data")

    def up(self, interface: str) -> None:
        self._request("up", {"interface": interface})

    def down(self, interface: str) -> None:
        self._request("down", {"interface": interface})

    def show(self, interface: str) -> dict[str, Any]:
        data: dict[str, Any] = self._request("show", {"interface": interface})
        return data

    def set_peer(
        self,
        interface: str,
        public_key: str,
        *,
        allowed_ips: list[str] | None = None,
        endpoint_host: str | None = None,
        endpoint_port: int | None = None,
        preshared_key: str | None = None,
        persistent_keepalive: int | None = None,
    ) -> None:
        args: dict[str, Any] = {
            "interface": interface,
            "public_key": public_key,
        }
        if allowed_ips is not None:
            args["allowed_ips"] = allowed_ips
        if endpoint_host is not None:
            args["endpoint_host"] = endpoint_host
        if endpoint_port is not None:
            args["endpoint_port"] = endpoint_port
        if preshared_key is not None:
            args["preshared_key"] = preshared_key
        if persistent_keepalive is not None:
            args["persistent_keepalive"] = persistent_keepalive
        self._request("set_peer", args)

    def remove_peer(self, interface: str, public_key: str) -> None:
        self._request("remove_peer", {"interface": interface, "public_key": public_key})

    def list_devices(self) -> list[str]:
        data: list[str] = self._request("list_devices")
        return data
