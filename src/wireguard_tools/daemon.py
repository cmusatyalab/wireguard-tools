#
# WireGuard Tools Daemon -- privileged helper over a Unix socket
#
# Copyright (c) 2024 Richard Dawson
# SPDX-License-Identifier: MIT
#

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
    interface = args.get("interface")
    if not interface:
        return {"ok": False, "error": "Missing required argument: interface"}
    try:
        up(interface)
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
    return {"ok": True}


def _cmd_down(args: dict[str, Any]) -> dict[str, Any]:
    interface = args.get("interface")
    if not interface:
        return {"ok": False, "error": "Missing required argument: interface"}
    try:
        down(interface)
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
    return {"ok": True}


def _cmd_show(args: dict[str, Any]) -> dict[str, Any]:
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
    """Handle one JSON-line request per connection."""

    def handle(self) -> None:
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
        data = json.dumps(response) + "\n"
        self.wfile.write(data.encode("utf-8"))
        self.wfile.flush()


class ThreadedUnixServer(socketserver.ThreadingMixIn, socketserver.UnixStreamServer):
    daemon_threads = True
    allow_reuse_address = True


def _set_socket_permissions(socket_path: str, group: str | None) -> None:
    """Set ownership and permissions on the daemon socket."""
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
    """Start the daemon and serve requests until interrupted."""
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
