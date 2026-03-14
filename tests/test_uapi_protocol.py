# Tests for UAPI protocol serialization (without real sockets).
# SPDX-License-Identifier: MIT

from ipaddress import IPv4Address, IPv6Address, ip_interface
from unittest.mock import MagicMock

import pytest

from wireguard_tools.wireguard_config import WireguardConfig, WireguardPeer
from wireguard_tools.wireguard_key import WireguardKey
from wireguard_tools.wireguard_uapi import WireguardUAPIDevice


def _make_device() -> WireguardUAPIDevice:
    """Create a WireguardUAPIDevice with a mocked socket."""
    dev = object.__new__(WireguardUAPIDevice)
    dev.interface = "wg-test"
    dev._buffer = ""
    dev.uapi_socket = MagicMock()
    return dev


class TestBuildPeerUAPI:
    def test_basic_peer(self) -> None:
        dev = _make_device()
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            endpoint_host=IPv4Address("10.0.0.1"),
            endpoint_port=51820,
            allowed_ips=[ip_interface("10.0.0.0/24")],
        )
        lines = dev._build_peer_uapi(peer)
        assert any(line.startswith("public_key=") for line in lines)
        assert "endpoint=10.0.0.1:51820" in lines
        assert "replace_allowed_ips=true" in lines
        assert any(line.startswith("allowed_ip=") for line in lines)

    def test_peer_without_endpoint(self) -> None:
        dev = _make_device()
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            allowed_ips=[ip_interface("10.0.0.0/24")],
        )
        lines = dev._build_peer_uapi(peer)
        assert not any("endpoint=" in line for line in lines)

    def test_peer_with_preshared_key_uses_hex(self) -> None:
        dev = _make_device()
        psk = WireguardKey.generate()
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            preshared_key=psk,
            allowed_ips=[],
        )
        lines = dev._build_peer_uapi(peer)
        psk_lines = [line for line in lines if line.startswith("preshared_key=")]
        assert len(psk_lines) == 1
        assert psk_lines[0] == f"preshared_key={psk.hex}"
        assert "+" not in psk_lines[0]
        assert "/" not in psk_lines[0]
        assert "==" not in psk_lines[0]

    def test_peer_with_persistent_keepalive(self) -> None:
        dev = _make_device()
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            persistent_keepalive=25,
            allowed_ips=[],
        )
        lines = dev._build_peer_uapi(peer)
        assert "persistent_keepalive_interval=25" in lines

    def test_ipv6_endpoint_uses_brackets(self) -> None:
        dev = _make_device()
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            endpoint_host=IPv6Address("::1"),
            endpoint_port=51820,
            allowed_ips=[],
        )
        lines = dev._build_peer_uapi(peer)
        assert "endpoint=[::1]:51820" in lines


class TestSetConfigSerialization:
    def test_set_config_includes_replace_peers(self) -> None:
        dev = _make_device()
        sent_data: list[bytes] = []
        dev.uapi_socket.sendall = lambda data: sent_data.append(data)
        dev.uapi_socket.recv = lambda size: b"errno=0\n\n"

        config = WireguardConfig(
            private_key=WireguardKey.generate(),
            listen_port=51820,
        )
        dev.set_config(config)

        payload = sent_data[0].decode()
        assert "set=1" in payload
        assert "replace_peers=true" in payload
        assert "listen_port=51820" in payload

    def test_set_config_private_key_hex(self) -> None:
        dev = _make_device()
        sent_data: list[bytes] = []
        dev.uapi_socket.sendall = lambda data: sent_data.append(data)
        dev.uapi_socket.recv = lambda size: b"errno=0\n\n"

        key = WireguardKey.generate()
        config = WireguardConfig(private_key=key)
        dev.set_config(config)

        payload = sent_data[0].decode()
        assert f"private_key={key.hex}" in payload


class TestSyncConfigSerialization:
    def test_sync_removes_absent_peers(self) -> None:
        dev = _make_device()
        sent_data: list[bytes] = []

        old_peer_key = WireguardKey.generate()
        new_peer_key = WireguardKey.generate()

        calls = [0]

        def mock_sendall(data: bytes) -> None:
            sent_data.append(data)

        def mock_recv(size: int) -> bytes:
            if calls[0] == 0:
                calls[0] = 1
                lines = [
                    f"public_key={old_peer_key.hex}",
                    "allowed_ip=10.0.0.1/32",
                    "errno=0",
                ]
                return ("\n".join(lines) + "\n\n").encode()
            return b"errno=0\n\n"

        dev.uapi_socket.sendall = mock_sendall
        dev.uapi_socket.recv = mock_recv

        new_config = WireguardConfig()
        new_config.add_peer(
            WireguardPeer(
                public_key=new_peer_key, allowed_ips=[ip_interface("10.0.0.2/32")]
            )
        )

        dev.sync_config(new_config)

        sync_payload = sent_data[1].decode()
        assert f"public_key={old_peer_key.hex}" in sync_payload
        assert "remove=true" in sync_payload
        assert f"public_key={new_peer_key.hex}" in sync_payload


class TestResolveEndpoint:
    def test_ipv4_passthrough(self) -> None:
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            endpoint_host=IPv4Address("10.0.0.1"),
            endpoint_port=51820,
            allowed_ips=[],
        )
        result = WireguardUAPIDevice._resolve_endpoint(peer)
        assert result == ("10.0.0.1", 51820)

    def test_ipv6_passthrough(self) -> None:
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            endpoint_host=IPv6Address("::1"),
            endpoint_port=51820,
            allowed_ips=[],
        )
        result = WireguardUAPIDevice._resolve_endpoint(peer)
        assert result == ("::1", 51820)

    def test_none_returns_none(self) -> None:
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            allowed_ips=[],
        )
        assert WireguardUAPIDevice._resolve_endpoint(peer) is None

    def test_hostname_resolution(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("WG_ENDPOINT_RESOLUTION_RETRIES", "0")
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            endpoint_host="localhost",
            endpoint_port=51820,
            allowed_ips=[],
        )
        result = WireguardUAPIDevice._resolve_endpoint(peer)
        assert result is not None
        assert result[1] == 51820

    def test_unresolvable_hostname_raises(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("WG_ENDPOINT_RESOLUTION_RETRIES", "0")
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            endpoint_host="this.host.should.not.exist.invalid",
            endpoint_port=51820,
            allowed_ips=[],
        )
        with pytest.raises(RuntimeError, match="Unable to resolve"):
            WireguardUAPIDevice._resolve_endpoint(peer)

    def test_invalid_retries_env_falls_back_to_default(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("WG_ENDPOINT_RESOLUTION_RETRIES", "notanumber")
        peer = WireguardPeer(
            public_key=WireguardKey.generate(),
            endpoint_host="localhost",
            endpoint_port=51820,
            allowed_ips=[],
        )
        result = WireguardUAPIDevice._resolve_endpoint(peer)
        assert result is not None
