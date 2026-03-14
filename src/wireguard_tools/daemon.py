#
# WireGuard Tools Daemon -- privileged helper over a Unix socket
#
# Copyright (c) 2024 Richard Dawson
# SPDX-License-Identifier: MIT
#

"""Privileged WireGuard management daemon exposing a JSON-over-Unix-socket API.

The daemon listens on a ``SOCK_STREAM`` Unix socket (default
``/var/run/wg-daemon.sock``) and accepts one JSON request per connection.

**Protocol:**

*  **Request** — a single JSON line::

       {"cmd": "<command>", "args": {<command-specific fields>}}

*  **Response** — a single JSON line::

       {"ok": true, "data": ...}   // on success
       {"ok": false, "error": "..."}  // on failure

Supported commands: ``up``, ``down``, ``show``, ``set_peer``,
``remove_peer``, ``list_devices``.

Socket ownership is configurable via ``--group`` (or ``WG_DAEMON_GROUP``)
so that unprivileged users in the designated group can issue requests
without requiring root.
"""

from __future__ import annotations

import argparse
import grp
import json
import logging
import os
import signal
import socketserver
import sys
from contextlib import closing
from ipaddress import ip_interface
from pathlib import Path
from typing import Any

from .wg_quick import down, up
from .wireguard_config import WireguardConfig, WireguardPeer
from .wireguard_device import WireguardDevice
from .wireguard_key import WireguardKey

DEFAULT_SOCKET_PATH = "/var/run/wg-daemon.sock"
SOCKET_PERMISSIONS = 0o660

logger = logging.getLogger("wg-daemon")


def _cmd_up(args: dict[str, Any]) -> dict[str, Any]:
    """Bring a WireGuard interface up.

    Delegates to :func:`~.wg_quick.up` which configures addresses, routes,
    and the WireGuard tunnel.

    :param args: Must contain ``"interface"`` (str) — the interface name.
    :returns: ``{"ok": True}`` on success, or ``{"ok": False, "error": ...}``
        on failure.
    :rtype: dict[str, Any]
    """
    interface = args.get("interface")
    if not interface:
        return {"ok": False, "error": "Missing required argument: interface"}
    try:
        up(interface)
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
    return {"ok": True}


def _cmd_down(args: dict[str, Any]) -> dict[str, Any]:
    """Tear down a WireGuard interface.

    Delegates to :func:`~.wg_quick.down` which removes addresses, routes,
    and the tunnel.

    :param args: Must contain ``"interface"`` (str) — the interface name.
    :returns: ``{"ok": True}`` on success, or ``{"ok": False, "error": ...}``
        on failure.
    :rtype: dict[str, Any]
    """
    interface = args.get("interface")
    if not interface:
        return {"ok": False, "error": "Missing required argument: interface"}
    try:
        down(interface)
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
    return {"ok": True}


def _cmd_show(args: dict[str, Any]) -> dict[str, Any]:
    """Return the current configuration of a WireGuard interface.

    Open the device, call :meth:`~.wireguard_device.WireguardDevice.get_config`,
    and serialise the result via
    :meth:`~.wireguard_config.WireguardConfig.asdict`.

    :param args: Must contain ``"interface"`` (str) — the interface name.
    :returns: ``{"ok": True, "data": <config dict>}`` on success, or
        ``{"ok": False, "error": ...}`` on failure.
    :rtype: dict[str, Any]
    """
    interface = args.get("interface")
    if not interface:
        return {"ok": False, "error": "Missing required argument: interface"}
    try:
        with closing(WireguardDevice.get(interface)) as device:
            config = device.get_config()
            return {"ok": True, "data": config.asdict()}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def _cmd_set_peer(args: dict[str, Any]) -> dict[str, Any]:
    """Add or update a peer on a WireGuard interface.

    Construct a :class:`~.wireguard_config.WireguardPeer` from *args*, merge
    it into the current running configuration via
    :meth:`~.wireguard_config.WireguardConfig.add_peer`, and apply the result
    with :meth:`~.wireguard_device.WireguardDevice.set_config`.

    :param args: Required keys: ``"interface"`` (str), ``"public_key"``
        (str, base64).  Optional keys: ``"allowed_ips"`` (list of CIDR
        strings), ``"endpoint_host"`` (str), ``"endpoint_port"`` (int/str),
        ``"preshared_key"`` (str, base64), ``"persistent_keepalive"``
        (int/str).
    :returns: ``{"ok": True}`` on success, or ``{"ok": False, "error": ...}``
        on failure.
    :rtype: dict[str, Any]
    """
    interface = args.get("interface")
    public_key = args.get("public_key")
    if not interface or not public_key:
        return {"ok": False, "error": "Missing required arguments: interface, public_key"}
    try:
        key = WireguardKey(public_key)
        peer_kwargs: dict[str, Any] = {"public_key": key}

        if "allowed_ips" in args:
            peer_kwargs["allowed_ips"] = [
                ip_interface(ip) for ip in args["allowed_ips"]
            ]
        if "endpoint_host" in args:
            peer_kwargs["endpoint_host"] = args["endpoint_host"]
        if "endpoint_port" in args:
            peer_kwargs["endpoint_port"] = int(args["endpoint_port"])
        if "preshared_key" in args:
            peer_kwargs["preshared_key"] = WireguardKey(args["preshared_key"])
        if "persistent_keepalive" in args:
            peer_kwargs["persistent_keepalive"] = int(args["persistent_keepalive"])

        peer = WireguardPeer(**peer_kwargs)

        with closing(WireguardDevice.get(interface)) as device:
            current = device.get_config()
            current.add_peer(peer)
            device.set_config(current)

        return {"ok": True}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def _cmd_remove_peer(args: dict[str, Any]) -> dict[str, Any]:
    """Remove a peer from a WireGuard interface.

    Look up the peer by its public key in the running configuration,
    delete it via :meth:`~.wireguard_config.WireguardConfig.del_peer`,
    and push the updated configuration to the device.

    :param args: Required keys: ``"interface"`` (str), ``"public_key"``
        (str, base64).
    :returns: ``{"ok": True}`` on success, or ``{"ok": False, "error": ...}``
        when the peer is not found or another error occurs.
    :rtype: dict[str, Any]
    """
    interface = args.get("interface")
    public_key = args.get("public_key")
    if not interface or not public_key:
        return {"ok": False, "error": "Missing required arguments: interface, public_key"}
    try:
        key = WireguardKey(public_key)
        with closing(WireguardDevice.get(interface)) as device:
            current = device.get_config()
            current.del_peer(key)
            device.set_config(current)
        return {"ok": True}
    except KeyError:
        return {"ok": False, "error": f"Peer {public_key} not found on {interface}"}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def _cmd_list_devices(_args: dict[str, Any]) -> dict[str, Any]:
    """List all active WireGuard interface names.

    Discovers interfaces via
    :meth:`~.wireguard_device.WireguardDevice.list` and returns their
    names.

    :param _args: Ignored (no arguments required for this command).
    :returns: ``{"ok": True, "data": [<interface names>]}`` on success, or
        ``{"ok": False, "error": ...}`` on failure.
    :rtype: dict[str, Any]
    """
    try:
        devices = [d.interface for d in WireguardDevice.list()]
        return {"ok": True, "data": devices}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


COMMANDS = {
    "up": _cmd_up,
    "down": _cmd_down,
    "show": _cmd_show,
    "set_peer": _cmd_set_peer,
    "remove_peer": _cmd_remove_peer,
    "list_devices": _cmd_list_devices,
}


class DaemonHandler(socketserver.StreamRequestHandler):
    """Handle a single JSON-line request per connection.

    Each accepted connection is expected to send exactly **one** JSON line
    (see the module docstring for the protocol).  The handler reads the
    line, dispatches it to the matching ``_cmd_*`` function from
    :data:`COMMANDS`, and writes a single JSON-line response before closing
    the connection.

    Malformed JSON or an unrecognised ``cmd`` value results in an
    ``{"ok": false, "error": "..."}`` response — the connection is never
    left hanging.
    """

    def handle(self) -> None:
        """Read one JSON request, dispatch it, and write the response.

        :returns: Nothing; the response is written directly to the socket.
        :rtype: None
        """
        try:
            raw = self.rfile.readline()
            if not raw:
                return
            request = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            response = {"ok": False, "error": f"Invalid request: {exc}"}
            self._send(response)
            return

        cmd = request.get("cmd")
        args = request.get("args", {})

        if cmd not in COMMANDS:
            response = {"ok": False, "error": f"Unknown command: {cmd}"}
        else:
            logger.info("cmd=%s args=%s", cmd, args)
            response = COMMANDS[cmd](args)

        self._send(response)

    def _send(self, response: dict[str, Any]) -> None:
        """Serialise *response* as a JSON line and flush it to the client.

        :param response: Dictionary to serialise.  By convention contains at
            least an ``"ok"`` boolean key.
        """
        data = json.dumps(response) + "\n"
        self.wfile.write(data.encode("utf-8"))
        self.wfile.flush()


class ThreadedUnixServer(socketserver.ThreadingMixIn, socketserver.UnixStreamServer):
    """Thread-per-connection Unix-domain stream server.

    Inherits :class:`~socketserver.ThreadingMixIn` to spawn a daemon thread
    for each accepted connection and :class:`~socketserver.UnixStreamServer`
    for ``AF_UNIX`` ``SOCK_STREAM`` transport.

    :cvar daemon_threads: ``True`` — worker threads do not prevent process
        exit.
    :cvar allow_reuse_address: ``True`` — allows rebinding after unclean
        shutdown.

    The socket file is created by the standard library; callers should set
    ownership and permissions via :func:`_set_socket_permissions` immediately
    after construction.
    """

    daemon_threads = True
    allow_reuse_address = True


def _set_socket_permissions(socket_path: str, group: str | None) -> None:
    """Set ownership and permissions on the daemon socket.

    If *group* is provided, the socket file's group is changed via
    :func:`os.chown`; if the group name cannot be resolved a warning is
    logged but execution continues.  Permissions are always set to
    :data:`SOCKET_PERMISSIONS` (``0o660``).

    :param socket_path: Filesystem path of the Unix socket.
    :param group: Optional Unix group name to assign to the socket file.
    """
    if group:
        try:
            gid = grp.getgrnam(group).gr_gid
            os.chown(socket_path, -1, gid)
        except KeyError:
            logger.warning("Group %r not found; socket group unchanged", group)
    os.chmod(socket_path, SOCKET_PERMISSIONS)


def serve(
    socket_path: str = DEFAULT_SOCKET_PATH,
    group: str | None = None,
) -> None:
    """Start the daemon and block, serving requests until interrupted.

    Create a :class:`ThreadedUnixServer` bound to *socket_path*, install
    ``SIGTERM`` / ``SIGINT`` handlers that trigger a graceful shutdown, and
    enter :meth:`~socketserver.BaseServer.serve_forever`.  On exit the
    socket file is unlinked.

    If *socket_path* already exists (e.g. from a previous unclean shutdown)
    it is removed before binding.

    :param socket_path: Filesystem path for the listening Unix socket.
    :param group: Optional Unix group name passed to
        :func:`_set_socket_permissions`.
    """
    path = Path(socket_path)
    if path.exists():
        path.unlink()

    server = ThreadedUnixServer(socket_path, DaemonHandler)

    _set_socket_permissions(socket_path, group)
    logger.info("Listening on %s", socket_path)

    def _shutdown(signum: int, _frame: Any) -> None:
        logger.info("Received signal %d, shutting down", signum)
        server.shutdown()

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    try:
        server.serve_forever()
    finally:
        server.server_close()
        if path.exists():
            path.unlink()
        logger.info("Daemon stopped")


def main() -> None:
    """Parse CLI arguments and start the daemon.

    Accepted arguments:

    ``--socket``
        Path for the Unix socket (env: ``WG_DAEMON_SOCKET``, default
        ``/var/run/wg-daemon.sock``).
    ``--group``
        Group name for socket ownership (env: ``WG_DAEMON_GROUP``, default
        ``wireguard``).
    ``--foreground``
        Run in foreground (default; intended for systemd management).
    ``-v`` / ``--verbose``
        Enable ``DEBUG``-level logging.

    Logging is emitted to *stderr* in a timestamped format.
    """
    parser = argparse.ArgumentParser(description="WireGuard Tools Daemon")
    parser.add_argument(
        "--socket",
        default=os.environ.get("WG_DAEMON_SOCKET", DEFAULT_SOCKET_PATH),
        help="Unix socket path (default: %(default)s)",
    )
    parser.add_argument(
        "--group",
        default=os.environ.get("WG_DAEMON_GROUP", "wireguard"),
        help="Group for socket ownership (default: %(default)s)",
    )
    parser.add_argument(
        "--foreground",
        action="store_true",
        default=True,
        help="Run in foreground (default; systemd manages lifecycle)",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
        stream=sys.stderr,
    )

    serve(socket_path=args.socket, group=args.group)


if __name__ == "__main__":
    main()
