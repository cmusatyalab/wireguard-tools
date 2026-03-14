#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

"""WireGuard userspace API (UAPI) device interface.

Communicate with WireGuard interfaces through the UAPI Unix-domain socket
protocol described in the `wireguard.h` header.  Each
:class:`WireguardUAPIDevice` instance owns a ``SOCK_STREAM`` connection to
``/var/run/wireguard/<iface>.sock`` and exposes ``get``, ``set``, and ``sync``
operations that translate between :class:`~.wireguard_config.WireguardConfig`
objects and the UAPI key=value wire format.

Typical usage::

    from contextlib import closing
    with closing(WireguardUAPIDevice("wg0")) as dev:
        cfg = dev.get_config()
"""

from __future__ import annotations

import os
import socket
import time
from ipaddress import IPv6Address, ip_address, ip_interface
from pathlib import Path
from typing import TYPE_CHECKING, Iterator

from .wireguard_config import WireguardConfig, WireguardPeer
from .wireguard_device import WireguardDevice
from .wireguard_key import WireguardKey

if TYPE_CHECKING:
    import os

WG_UAPI_SOCKET_DIR = Path("/var/run/wireguard")


class WireguardUAPIDevice(WireguardDevice):
    """WireGuard device controlled through the userspace API socket.

    The instance connects to the UAPI Unix socket at construction time and
    retains the connection for the lifetime of the object.  Callers **must**
    call :meth:`close` (or use :func:`contextlib.closing`) to release the
    underlying file descriptor.

    The UAPI protocol is a simple newline-delimited ``key=value`` text
    format transmitted over a ``SOCK_STREAM`` Unix socket located under
    :data:`WG_UAPI_SOCKET_DIR`.  A ``get`` request consists of the line
    ``get=1\\n\\n``; a ``set`` request begins with ``set=1\\n`` followed by
    interface and peer fields, terminated by a blank line.

    :param uapi_path: Interface name (e.g. ``"wg0"``) or an absolute path to
        the UAPI socket file.
    """

    def __init__(self, uapi_path: str | os.PathLike[str]) -> None:
        """Open a UAPI connection to a WireGuard interface.

        When *uapi_path* is a plain string the socket is looked up as
        ``/var/run/wireguard/<uapi_path>.sock``.  An :class:`os.PathLike`
        value is used verbatim.

        :param uapi_path: Interface name or absolute socket path.
        :raises FileNotFoundError: If the socket file does not exist.
        """
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
        """Close the underlying UAPI Unix socket.

        After calling this method the device object must not be reused.
        Calling :meth:`close` on an already-closed device is safe (the
        socket's own ``close`` is idempotent).
        """
        self.uapi_socket.close()

    def get_config(self) -> WireguardConfig:
        """Retrieve the current interface configuration via UAPI ``get``.

        Send a ``get=1`` request over the socket and parse the key=value
        response into a :class:`~.wireguard_config.WireguardConfig`,
        including all peer entries and device statistics such as
        ``last_handshake``, ``rx_bytes``, and ``tx_bytes``.

        :returns: Parsed configuration snapshot of the running interface.
        :rtype: WireguardConfig
        :raises RuntimeError: If the UAPI response carries a non-zero
            ``errno`` or an unexpected ``protocol_version``.
        """
        self.uapi_socket.sendall(b"get=1\n\n")
        response = self._recvmsg()

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
                peer.preshared_key = WireguardKey(value) if value else None
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

    @staticmethod
    def _resolve_endpoint(peer: WireguardPeer) -> tuple[str, int] | None:
        """Resolve a peer endpoint to an ``(ip, port)`` tuple.

        If the endpoint host is already an IP address it is returned directly.
        When the host is a DNS name, the method performs ``getaddrinfo`` with
        retries to tolerate transient resolution failures, matching the
        behaviour of the C ``wg(8)`` implementation.

        The maximum number of retries is controlled by the
        ``WG_ENDPOINT_RESOLUTION_RETRIES`` environment variable (default
        ``15``).  The special value ``"infinity"`` retries forever.  Back-off
        between attempts grows linearly (``attempt * 0.25 s``, capped at
        ``5 s``).

        :param peer: Peer whose :attr:`endpoint_host` and
            :attr:`endpoint_port` are to be resolved.
        :returns: ``(ip_string, port)`` tuple, or ``None`` when the peer has
            no endpoint configured.
        :rtype: tuple[str, int] | None
        :raises RuntimeError: If DNS resolution fails after exhausting all
            retries.
        """
        if peer.endpoint_host is None or peer.endpoint_port is None:
            return None
        host = peer.endpoint_host
        if isinstance(host, str):
            retries_env = os.environ.get("WG_ENDPOINT_RESOLUTION_RETRIES", "15")
            if retries_env == "infinity":
                max_retries = float("inf")
            else:
                try:
                    max_retries = int(retries_env)
                except ValueError:
                    max_retries = 15
            attempt = 0
            while True:
                try:
                    infos = socket.getaddrinfo(
                        host, peer.endpoint_port, type=socket.SOCK_DGRAM
                    )
                    if infos:
                        host = infos[0][4][0]
                        break
                except socket.gaierror:
                    pass
                attempt += 1
                if attempt > max_retries:
                    msg = f"Unable to resolve endpoint: {host}"
                    raise RuntimeError(msg)
                time.sleep(min(attempt * 0.25, 5.0))
        return str(host), peer.endpoint_port

    def _build_peer_uapi(self, peer: WireguardPeer) -> list[str]:
        """Build UAPI ``set`` key=value lines for a single peer.

        Produce the ordered sequence of UAPI fields that describe *peer*:
        ``public_key``, optional ``endpoint``, optional ``preshared_key``,
        optional ``persistent_keepalive_interval``, and the full
        ``allowed_ip`` list (preceded by ``replace_allowed_ips=true``).

        IPv6 endpoint addresses are enclosed in brackets as required by the
        wire format.  Endpoint hostnames are resolved via
        :meth:`_resolve_endpoint` before serialisation.

        :param peer: Peer to serialise.
        :returns: List of ``key=value`` strings (without trailing newlines).
        :rtype: list[str]
        """
        lines = [f"public_key={peer.public_key.hex}"]
        endpoint = self._resolve_endpoint(peer)
        if endpoint is not None:
            host_str = endpoint[0]
            try:
                if isinstance(IPv6Address(host_str), IPv6Address):
                    host_str = f"[{host_str}]"
            except ValueError:
                pass
            lines.append(f"endpoint={host_str}:{endpoint[1]}")
        if peer.preshared_key is not None:
            lines.append(f"preshared_key={peer.preshared_key.hex}")
        if peer.persistent_keepalive is not None:
            lines.append(
                f"persistent_keepalive_interval={peer.persistent_keepalive}",
            )
        lines.append("replace_allowed_ips=true")
        lines.extend(f"allowed_ip={address}" for address in peer.allowed_ips)
        return lines

    def _send_uapi_set(self, uapi: list[str]) -> None:
        """Send a UAPI ``set`` message and verify success.

        Join the *uapi* lines with newlines, append a blank-line terminator,
        and transmit the payload over the socket.  The response is expected to
        be a single ``errno=<n>`` line; any other response shape or a non-zero
        errno raises :class:`RuntimeError`.

        .. note::
           This method **mutates** *uapi* by appending an empty trailing
           element used as the blank-line terminator.

        :param uapi: Ordered UAPI key=value lines (must already begin with
            ``set=1``).
        :raises RuntimeError: If the response is malformed or carries a
            non-zero errno.
        """
        uapi.append("\n")
        self.uapi_socket.sendall("\n".join(uapi).encode())
        response = self._recvmsg()
        if not response or response[0][0] != "errno":
            msg = "WireguardUAPIDevice: unexpected UAPI response"
            raise RuntimeError(msg)
        errno = int(response[0][1])
        if errno != 0:
            msg = f"WireguardUAPIDevice: set failed with errno {errno}"
            raise RuntimeError(msg)

    def set_config(self, config: WireguardConfig) -> None:
        """Replace the full interface configuration (``setconf`` semantics).

        Build a UAPI ``set`` payload that writes the interface-level fields
        (``private_key``, ``listen_port``, ``fwmark``) and then all peers with
        ``replace_peers=true``, effectively discarding any peers not present
        in *config*.

        :param config: Desired configuration to apply.
        :raises RuntimeError: If the kernel rejects the configuration (the
            UAPI response carries a non-zero errno).
        """
        uapi = ["set=1"]
        if config.private_key is not None:
            uapi.append(f"private_key={config.private_key.hex}")
        if config.listen_port is not None:
            uapi.append(f"listen_port={config.listen_port}")
        if config.fwmark is not None:
            uapi.append(f"fwmark={config.fwmark}")

        uapi.append("replace_peers=true")
        for peer in config.peers.values():
            uapi.extend(self._build_peer_uapi(peer))

        self._send_uapi_set(uapi)

    def sync_config(self, config: WireguardConfig) -> None:
        """Synchronise the running configuration with *config* (``syncconf`` semantics).

        Fetch the current interface state via :meth:`get_config`, compute the
        diff, and emit only the necessary UAPI operations:

        * Peers present in the running config but absent from *config* are
          removed (``remove=true``).
        * Peers that are new or differ from the running config are
          (re-)applied via :meth:`_build_peer_uapi`.
        * Unchanged peers are left untouched, preserving handshake state and
          traffic counters.

        Interface-level fields (``private_key``, ``listen_port``, ``fwmark``)
        are always written when set on *config*.

        :param config: Desired target configuration.
        :raises RuntimeError: If the kernel rejects the update.
        """
        current = self.get_config()

        uapi = ["set=1"]
        if config.private_key is not None:
            uapi.append(f"private_key={config.private_key.hex}")
        if config.listen_port is not None:
            uapi.append(f"listen_port={config.listen_port}")
        if config.fwmark is not None:
            uapi.append(f"fwmark={config.fwmark}")

        cur_keys = set(current.peers)
        new_keys = set(config.peers)

        for key in cur_keys - new_keys:
            uapi.append(f"public_key={key.hex}")
            uapi.append("remove=true")

        for key in new_keys:
            new_peer = config.peers[key]
            old_peer = current.peers.get(key)
            if old_peer is not None and old_peer == new_peer:
                continue
            uapi.extend(self._build_peer_uapi(new_peer))

        self._send_uapi_set(uapi)

    # a wireguard UAPI response message is a series of key=value lines
    # followed by an empty line
    def _recvmsg(self) -> list[tuple[str, str]]:
        """Read a complete UAPI response message from the socket.

        The UAPI wire protocol delimits messages with a blank line.  This
        method reads from the socket (using an internal buffer to handle
        partial reads) until the blank-line terminator is encountered, then
        splits each line on the first ``=`` into ``(key, value)`` pairs.

        :returns: Ordered list of ``(key, value)`` tuples comprising the
            response.  An empty list is returned when the peer sends an
            immediate blank line.
        :rtype: list[tuple[str, str]]
        """
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
        """Discover all WireGuard interfaces with active UAPI sockets.

        Glob ``/var/run/wireguard/*.sock`` and yield one connected
        :class:`WireguardUAPIDevice` per socket file found.

        :returns: Iterator of open device instances.  Callers are responsible
            for closing each device.
        :rtype: Iterator[WireguardUAPIDevice]
        """
        for socket_path in WG_UAPI_SOCKET_DIR.glob("*.sock"):
            yield cls(socket_path.stem)
