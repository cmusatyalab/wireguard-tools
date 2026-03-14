# Tests for the wg-daemon JSON-over-Unix-socket protocol
#
# All privileged operations (wg_quick, WireguardDevice) are mocked so
# these tests run without root.

from __future__ import annotations

import json
import os
import socket
import tempfile
import threading
import time
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from wireguard_tools.daemon import DaemonHandler, ThreadedUnixServer, serve
from wireguard_tools.daemon_client import DaemonError, WgDaemonClient


@pytest.fixture()
def daemon_socket(tmp_path):
    """Start a real daemon on a temp socket and yield its path."""
    sock_path = str(tmp_path / "test-wg-daemon.sock")

    server = ThreadedUnixServer(sock_path, DaemonHandler)
    os.chmod(sock_path, 0o660)

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    yield sock_path

    server.shutdown()
    server.server_close()


@pytest.fixture()
def client(daemon_socket):
    return WgDaemonClient(socket_path=daemon_socket)


def _raw_request(sock_path: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Send a raw JSON request and read the response."""
    raw = json.dumps(payload) + "\n"
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        s.connect(sock_path)
        s.sendall(raw.encode())
        s.shutdown(socket.SHUT_WR)
        chunks = []
        while True:
            chunk = s.recv(65536)
            if not chunk:
                break
            chunks.append(chunk)
    finally:
        s.close()
    return json.loads(b"".join(chunks).decode())


class TestProtocol:
    """Test the wire protocol directly."""

    def test_unknown_command(self, daemon_socket):
        resp = _raw_request(daemon_socket, {"cmd": "nonexistent", "args": {}})
        assert resp["ok"] is False
        assert "Unknown command" in resp["error"]

    def test_invalid_json(self, daemon_socket):
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        try:
            s.connect(daemon_socket)
            s.sendall(b"not valid json\n")
            s.shutdown(socket.SHUT_WR)
            chunks = []
            while True:
                chunk = s.recv(65536)
                if not chunk:
                    break
                chunks.append(chunk)
        finally:
            s.close()
        resp = json.loads(b"".join(chunks).decode())
        assert resp["ok"] is False
        assert "Invalid request" in resp["error"]

    def test_missing_cmd(self, daemon_socket):
        resp = _raw_request(daemon_socket, {"args": {}})
        assert resp["ok"] is False
        assert "Unknown command" in resp["error"]


class TestUpDown:
    @patch("wireguard_tools.daemon.up")
    def test_up_success(self, mock_up, client):
        mock_up.return_value = None
        client.up("wg0")
        mock_up.assert_called_once_with("wg0")

    @patch("wireguard_tools.daemon.up")
    def test_up_missing_interface(self, mock_up, daemon_socket):
        resp = _raw_request(daemon_socket, {"cmd": "up", "args": {}})
        assert resp["ok"] is False
        assert "interface" in resp["error"].lower()
        mock_up.assert_not_called()

    @patch("wireguard_tools.daemon.up")
    def test_up_failure(self, mock_up, client):
        mock_up.side_effect = RuntimeError("Interface wg0 already exists")
        with pytest.raises(DaemonError, match="already exists"):
            client.up("wg0")

    @patch("wireguard_tools.daemon.down")
    def test_down_success(self, mock_down, client):
        mock_down.return_value = None
        client.down("wg0")
        mock_down.assert_called_once_with("wg0")


class TestShow:
    @patch("wireguard_tools.daemon.WireguardDevice.get")
    def test_show_returns_config(self, mock_get, client):
        mock_device = MagicMock()
        mock_config = MagicMock()
        mock_config.asdict.return_value = {
            "private_key": "abc",
            "listen_port": 51820,
            "peers": [],
        }
        mock_device.get_config.return_value = mock_config
        mock_device.__enter__ = MagicMock(return_value=mock_device)
        mock_device.__exit__ = MagicMock(return_value=False)
        mock_device.close = MagicMock()
        mock_get.return_value = mock_device

        result = client.show("wg0")
        assert result["listen_port"] == 51820

    @patch("wireguard_tools.daemon.WireguardDevice.get")
    def test_show_missing_interface(self, mock_get, daemon_socket):
        resp = _raw_request(daemon_socket, {"cmd": "show", "args": {}})
        assert resp["ok"] is False
        mock_get.assert_not_called()


class TestSetPeer:
    @patch("wireguard_tools.daemon.WireguardDevice.get")
    def test_set_peer_success(self, mock_get, client, example_wgkey):
        mock_device = MagicMock()
        mock_config = MagicMock()
        mock_device.get_config.return_value = mock_config
        mock_device.close = MagicMock()
        mock_get.return_value = mock_device

        client.set_peer(
            "wg0",
            example_wgkey,
            allowed_ips=["10.0.0.2/32"],
            persistent_keepalive=25,
        )

        mock_config.add_peer.assert_called_once()
        mock_device.set_config.assert_called_once_with(mock_config)

    def test_set_peer_missing_args(self, daemon_socket):
        resp = _raw_request(
            daemon_socket,
            {"cmd": "set_peer", "args": {"interface": "wg0"}},
        )
        assert resp["ok"] is False
        assert "public_key" in resp["error"].lower()


class TestRemovePeer:
    @patch("wireguard_tools.daemon.WireguardDevice.get")
    def test_remove_peer_success(self, mock_get, client, example_wgkey):
        mock_device = MagicMock()
        mock_config = MagicMock()
        mock_device.get_config.return_value = mock_config
        mock_device.close = MagicMock()
        mock_get.return_value = mock_device

        client.remove_peer("wg0", example_wgkey)

        mock_config.del_peer.assert_called_once()
        mock_device.set_config.assert_called_once()


class TestListDevices:
    @patch("wireguard_tools.daemon.WireguardDevice.list")
    def test_list_devices(self, mock_list, client):
        dev1 = MagicMock()
        dev1.interface = "wg0"
        dev2 = MagicMock()
        dev2.interface = "wg1"
        mock_list.return_value = iter([dev1, dev2])

        result = client.list_devices()
        assert result == ["wg0", "wg1"]


class TestClientErrorHandling:
    def test_connection_refused(self):
        client = WgDaemonClient(socket_path="/tmp/nonexistent-wg-socket.sock")
        with pytest.raises((ConnectionRefusedError, FileNotFoundError)):
            client.up("wg0")

    def test_env_var_socket_path(self, daemon_socket):
        with patch.dict(os.environ, {"WG_DAEMON_SOCKET": daemon_socket}):
            c = WgDaemonClient()
            assert c.socket_path == daemon_socket
