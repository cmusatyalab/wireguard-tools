#
# WireGuard Daemon Client -- IPC over a Unix socket
#
# Copyright (c) 2024 Richard Dawson
# SPDX-License-Identifier: MIT
#
"""Client for the ``wg-daemon`` Unix-socket JSON-line protocol.

This module provides :class:`WgDaemonClient`, a thin synchronous client
that communicates with a privileged WireGuard daemon over a Unix-domain
stream socket.  Each public method opens a fresh connection, sends one
JSON request terminated by a newline, shuts down the write half of the
socket, reads the full JSON response, and closes the connection.  This
keeps the protocol entirely stateless.

The daemon is expected to reply with a JSON object containing at least
an ``ok`` boolean field.  On success the ``data`` field (if present) is
returned; on failure a :class:`DaemonError` is raised with the
``error`` message.
"""

from __future__ import annotations

import json
import os
import socket
from typing import Any

DEFAULT_SOCKET_PATH = "/var/run/wg-daemon.sock"


class DaemonError(RuntimeError):
    """Raised when the daemon returns a non-OK response.

    The exception message is taken from the ``error`` field of the JSON
    response, or falls back to ``"Unknown daemon error"`` when the field
    is absent.
    """


class WgDaemonClient:
    """Thin synchronous client for the ``wg-daemon`` Unix-socket protocol.

    Each public method opens a fresh ``AF_UNIX`` stream connection, sends
    a single JSON-line request, and reads the full JSON response before
    closing the socket.  This makes every call stateless and avoids the
    need for connection pooling or keep-alive management.

    The socket path is resolved in the following order:

    1. The *socket_path* constructor argument (if not ``None``).
    2. The ``WG_DAEMON_SOCKET`` environment variable.
    3. :data:`DEFAULT_SOCKET_PATH` (``/var/run/wg-daemon.sock``).

    :param socket_path: Explicit path to the daemon's Unix socket, or
        ``None`` to auto-detect.
    :type socket_path: str | None
    """

    def __init__(
        self,
        socket_path: str | None = None,
    ) -> None:
        """Initialise the client and resolve the socket path.

        :param socket_path: Override for the daemon socket path.  When
            ``None``, the ``WG_DAEMON_SOCKET`` environment variable is
            tried, falling back to :data:`DEFAULT_SOCKET_PATH`.
        :type socket_path: str | None
        """
        self.socket_path = (
            socket_path
            or os.environ.get("WG_DAEMON_SOCKET")
            or DEFAULT_SOCKET_PATH
        )

    def _request(self, cmd: str, args: dict[str, Any] | None = None) -> Any:
        """Send a single JSON-line command and return the response data.

        Open a new ``AF_UNIX`` connection to :attr:`socket_path`, send a
        JSON object of the form ``{"cmd": "<cmd>", "args": {…}}``,
        terminate the write side, read the entire response, and parse it
        as JSON.

        :param cmd: The daemon command name (e.g. ``"up"``, ``"show"``).
        :type cmd: str
        :param args: Optional mapping of command arguments.
        :type args: dict[str, Any] | None
        :returns: The ``data`` field of the response, or ``None`` if the
            field is absent.
        :rtype: Any
        :raises DaemonError: If the response ``ok`` field is falsy.
        :raises ConnectionRefusedError: If the daemon socket is not
            reachable.
        """
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
        """Bring a WireGuard interface up.

        :param interface: Name of the WireGuard network interface
            (e.g. ``"wg0"``).
        :type interface: str
        :raises DaemonError: If the daemon reports a failure.
        """
        self._request("up", {"interface": interface})

    def down(self, interface: str) -> None:
        """Tear down a WireGuard interface.

        :param interface: Name of the WireGuard network interface.
        :type interface: str
        :raises DaemonError: If the daemon reports a failure.
        """
        self._request("down", {"interface": interface})

    def show(self, interface: str) -> dict[str, Any]:
        """Retrieve the current configuration and status of an interface.

        :param interface: Name of the WireGuard network interface.
        :type interface: str
        :returns: A dictionary of interface attributes and peer
            information as returned by the daemon.
        :rtype: dict[str, Any]
        :raises DaemonError: If the daemon reports a failure.
        """
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
        """Add or update a peer on the given interface.

        Only the parameters that are not ``None`` are forwarded to the
        daemon; omitted parameters leave the corresponding peer setting
        unchanged (for existing peers) or at the daemon's default (for
        new peers).

        :param interface: Name of the WireGuard network interface.
        :type interface: str
        :param public_key: Base64-encoded public key of the peer.
        :type public_key: str
        :param allowed_ips: CIDR-notation networks the peer is allowed
            to send traffic from (e.g. ``["10.0.0.2/32"]``).
        :type allowed_ips: list[str] | None
        :param endpoint_host: Hostname or IP address of the peer's
            endpoint.
        :type endpoint_host: str | None
        :param endpoint_port: UDP port of the peer's endpoint.
        :type endpoint_port: int | None
        :param preshared_key: Base64-encoded preshared key, or ``None``
            to leave unset.
        :type preshared_key: str | None
        :param persistent_keepalive: Keepalive interval in seconds, or
            ``None`` to disable.
        :type persistent_keepalive: int | None
        :raises DaemonError: If the daemon reports a failure.
        """
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
        """Remove a peer from the given interface.

        :param interface: Name of the WireGuard network interface.
        :type interface: str
        :param public_key: Base64-encoded public key of the peer to
            remove.
        :type public_key: str
        :raises DaemonError: If the daemon reports a failure.
        """
        self._request("remove_peer", {"interface": interface, "public_key": public_key})

    def list_devices(self) -> list[str]:
        """List all WireGuard interfaces known to the daemon.

        :returns: A list of interface names (e.g. ``["wg0", "wg1"]``).
        :rtype: list[str]
        :raises DaemonError: If the daemon reports a failure.
        """
        data: list[str] = self._request("list_devices")
        return data
