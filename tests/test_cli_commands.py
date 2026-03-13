# Tests for CLI command parsing and logic.
# SPDX-License-Identifier: MIT

import pytest

from wireguard_tools.cli import SHOW_FIELDS, _parse_set_args
from wireguard_tools.wireguard_key import WireguardKey


class TestParseSetArgs:
    def test_empty_raises(self) -> None:
        with pytest.raises(ValueError):
            _parse_set_args([])

    def test_interface_only(self) -> None:
        iface, params, peers = _parse_set_args(["wg0"])
        assert iface == "wg0"
        assert params == {}
        assert peers == []

    def test_listen_port(self) -> None:
        _, params, _ = _parse_set_args(["wg0", "listen-port", "51820"])
        assert params["listen_port"] == 51820

    def test_fwmark_decimal(self) -> None:
        _, params, _ = _parse_set_args(["wg0", "fwmark", "51820"])
        assert params["fwmark"] == 51820

    def test_fwmark_hex(self) -> None:
        _, params, _ = _parse_set_args(["wg0", "fwmark", "0xca6c"])
        assert params["fwmark"] == 0xCA6C

    def test_fwmark_off(self) -> None:
        _, params, _ = _parse_set_args(["wg0", "fwmark", "off"])
        assert params["fwmark"] == 0

    def test_peer_basic(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(["wg0", "peer", key])
        assert len(peers) == 1
        assert str(peers[0]["public_key"]) == key

    def test_peer_remove(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(["wg0", "peer", key, "remove"])
        assert peers[0]["remove"] is True

    def test_peer_endpoint(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(
            ["wg0", "peer", key, "endpoint", "10.0.0.1:51820"]
        )
        assert peers[0]["endpoint_host"] == "10.0.0.1"
        assert peers[0]["endpoint_port"] == 51820

    def test_peer_ipv6_endpoint(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(
            ["wg0", "peer", key, "endpoint", "[::1]:51820"]
        )
        assert peers[0]["endpoint_host"] == "::1"
        assert peers[0]["endpoint_port"] == 51820

    def test_peer_persistent_keepalive(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(
            ["wg0", "peer", key, "persistent-keepalive", "25"]
        )
        assert peers[0]["persistent_keepalive"] == 25

    def test_peer_persistent_keepalive_off(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(
            ["wg0", "peer", key, "persistent-keepalive", "off"]
        )
        assert peers[0]["persistent_keepalive"] == 0

    def test_peer_allowed_ips_replace(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(
            ["wg0", "peer", key, "allowed-ips", "10.0.0.0/24,10.1.0.0/24"]
        )
        assert len(peers[0]["allowed_ips"]) == 2
        assert peers[0]["replace_allowed_ips"] is True

    def test_peer_allowed_ips_empty_clears(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(["wg0", "peer", key, "allowed-ips", ""])
        assert peers[0]["allowed_ips"] == []
        assert peers[0]["replace_allowed_ips"] is True

    def test_peer_allowed_ips_incremental(self) -> None:
        key = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(
            ["wg0", "peer", key, "allowed-ips", "+10.0.0.0/24,-10.1.0.0/24"]
        )
        assert len(peers[0]["add_allowed_ips"]) == 1
        assert len(peers[0]["remove_allowed_ips"]) == 1
        assert str(peers[0]["add_allowed_ips"][0]) == "10.0.0.0/24"

    def test_multiple_peers(self) -> None:
        k1 = str(WireguardKey.generate())
        k2 = str(WireguardKey.generate())
        _, _, peers = _parse_set_args(
            [
                "wg0",
                "peer",
                k1,
                "allowed-ips",
                "10.0.0.0/24",
                "peer",
                k2,
                "allowed-ips",
                "10.1.0.0/24",
            ]
        )
        assert len(peers) == 2

    def test_interface_params_and_peers_combined(self) -> None:
        key = str(WireguardKey.generate())
        iface, params, peers = _parse_set_args(
            [
                "wg0",
                "listen-port",
                "51820",
                "peer",
                key,
                "endpoint",
                "10.0.0.1:51820",
            ]
        )
        assert iface == "wg0"
        assert params["listen_port"] == 51820
        assert len(peers) == 1

    def test_unknown_option_raises(self) -> None:
        with pytest.raises(ValueError, match="Unknown option"):
            _parse_set_args(["wg0", "bogus-option"])

    def test_remove_without_peer_raises(self) -> None:
        with pytest.raises(ValueError, match="must follow"):
            _parse_set_args(["wg0", "remove"])

    def test_endpoint_without_peer_raises(self) -> None:
        with pytest.raises(ValueError, match="must follow"):
            _parse_set_args(["wg0", "endpoint", "10.0.0.1:51820"])


class TestShowFields:
    def test_all_expected_fields_present(self) -> None:
        expected = {
            "public-key",
            "private-key",
            "listen-port",
            "fwmark",
            "peers",
            "preshared-keys",
            "endpoints",
            "allowed-ips",
            "latest-handshakes",
            "persistent-keepalive",
            "transfer",
            "dump",
        }
        assert set(SHOW_FIELDS) == expected
