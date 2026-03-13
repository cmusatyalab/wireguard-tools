# Tests for config parsing enhancements: IPv6 endpoints, FwMark hex,
# AllowedIPs separators, Table/SaveConfig, and round-trip fidelity.
# SPDX-License-Identifier: MIT

from io import StringIO

import pytest

from wireguard_tools.wireguard_config import (
    WireguardConfig,
    WireguardPeer,
    _parse_endpoint,
    _split_comma_list,
)
from wireguard_tools.wireguard_key import WireguardKey


class TestParseEndpoint:
    def test_ipv4(self) -> None:
        host, port = _parse_endpoint("192.168.1.1:51820")
        assert host == "192.168.1.1"
        assert port == 51820

    def test_ipv6_bracket(self) -> None:
        host, port = _parse_endpoint("[2607:5300:60:6b0::c05f:543]:2468")
        assert host == "2607:5300:60:6b0::c05f:543"
        assert port == 2468

    def test_hostname(self) -> None:
        host, port = _parse_endpoint("vpn.example.com:51820")
        assert host == "vpn.example.com"
        assert port == 51820


class TestSplitCommaList:
    def test_comma_space(self) -> None:
        assert _split_comma_list("a, b, c") == ["a", "b", "c"]

    def test_comma_no_space(self) -> None:
        assert _split_comma_list("a,b,c") == ["a", "b", "c"]

    def test_mixed_whitespace(self) -> None:
        assert _split_comma_list("a ,b, c , d") == ["a", "b", "c", "d"]

    def test_single(self) -> None:
        assert _split_comma_list("10.0.0.1/32") == ["10.0.0.1/32"]

    def test_trailing_comma(self) -> None:
        assert _split_comma_list("a,b,") == ["a", "b"]

    def test_double_comma(self) -> None:
        assert _split_comma_list("a,,b") == ["a", "b"]

    def test_empty_string(self) -> None:
        assert _split_comma_list("") == []


IPV6_CONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
ListenPort = 51820

[Peer]
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
Endpoint = [2607:5300:60:6b0::c05f:543]:2468
AllowedIPs = 10.0.0.1/32
"""

FWMARK_HEX_CONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
FwMark = 0xca6c
"""

COMMA_NOSPACE_CONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=

[Peer]
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
AllowedIPs = 10.0.0.1/32,10.0.0.2/32,10.0.0.3/32
"""

TABLE_SAVECONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
ListenPort = 51820
MTU = 1420
Table = 1234
SaveConfig = true
Address = 10.0.0.1/24
"""


class TestIPv6EndpointConfig:
    def test_parse_ipv6_endpoint(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(IPV6_CONFIG))
        peer = list(config.peers.values())[0]
        assert str(peer.endpoint_host) == "2607:5300:60:6b0::c05f:543"
        assert peer.endpoint_port == 2468

    def test_roundtrip_ipv6_endpoint(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(IPV6_CONFIG))
        output = config.to_wgconfig()
        assert "[2607:5300:60:6b0::c05f:543]:2468" in output

    def test_reparsed_ipv6_endpoint(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(IPV6_CONFIG))
        output = config.to_wgconfig()
        config2 = WireguardConfig.from_wgconfig(StringIO(output))
        peer2 = list(config2.peers.values())[0]
        assert str(peer2.endpoint_host) == "2607:5300:60:6b0::c05f:543"
        assert peer2.endpoint_port == 2468


class TestFwMarkHex:
    def test_parse_hex_fwmark(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(FWMARK_HEX_CONFIG))
        assert config.fwmark == 0xCA6C

    def test_parse_decimal_fwmark(self) -> None:
        decimal = FWMARK_HEX_CONFIG.replace("0xca6c", "51820")
        config = WireguardConfig.from_wgconfig(StringIO(decimal))
        assert config.fwmark == 51820


class TestAllowedIPsSeparator:
    def test_comma_without_space(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(COMMA_NOSPACE_CONFIG))
        peer = list(config.peers.values())[0]
        assert len(peer.allowed_ips) == 3
        assert str(peer.allowed_ips[0]) == "10.0.0.1/32"
        assert str(peer.allowed_ips[2]) == "10.0.0.3/32"


class TestTableAndSaveConfig:
    def test_parse_table(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(TABLE_SAVECONFIG))
        assert config.table == "1234"

    def test_parse_save_config(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(TABLE_SAVECONFIG))
        assert config.saveconfig is True

    def test_emit_table_and_save_config(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(TABLE_SAVECONFIG))
        output = config.to_wgconfig(wgquick_format=True)
        assert "Table = 1234" in output
        assert "SaveConfig = true" in output

    def test_table_off(self) -> None:
        text = TABLE_SAVECONFIG.replace("Table = 1234", "Table = off")
        config = WireguardConfig.from_wgconfig(StringIO(text))
        assert config.table == "off"

    def test_table_auto(self) -> None:
        text = TABLE_SAVECONFIG.replace("Table = 1234", "Table = auto")
        config = WireguardConfig.from_wgconfig(StringIO(text))
        assert config.table == "auto"

    def test_save_config_false(self) -> None:
        text = TABLE_SAVECONFIG.replace("SaveConfig = true", "SaveConfig = false")
        config = WireguardConfig.from_wgconfig(StringIO(text))
        assert config.saveconfig is False

    def test_not_emitted_in_non_wgquick(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(TABLE_SAVECONFIG))
        output = config.to_wgconfig(wgquick_format=False)
        assert "Table" not in output
        assert "SaveConfig" not in output


class TestPeerFromDict:
    def test_ipv6_endpoint_from_dict(self) -> None:
        d = {
            "public_key": "ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=",
            "endpoint": "[::1]:51820",
            "allowed_ips": ["10.0.0.1/32"],
        }
        peer = WireguardPeer.from_dict(d)
        assert str(peer.endpoint_host) == "::1"
        assert peer.endpoint_port == 51820


class TestConfigFromDict:
    def test_full_roundtrip(self) -> None:
        d = {
            "private_key": "DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=",
            "listen_port": 51820,
            "addresses": ["10.0.0.1/24"],
            "dns": ["1.1.1.1", "example.local"],
            "peers": [
                {
                    "public_key": "ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=",
                    "endpoint": "192.168.1.1:51820",
                    "allowed_ips": ["10.0.0.0/24"],
                    "persistent_keepalive": 25,
                },
            ],
        }
        config = WireguardConfig.from_dict(d)
        output = config.to_wgconfig(wgquick_format=True)
        config2 = WireguardConfig.from_wgconfig(StringIO(output))
        assert len(config2.peers) == 1
        assert config2.listen_port == 51820
        assert len(config2.dns_servers) == 1
        assert len(config2.search_domains) == 1


class TestMultipleInterfaceSections:
    def test_raises_on_duplicate_interface(self) -> None:
        bad = (
            "[Interface]\nPrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=\n"
            "\n[Interface]\nListenPort = 51820\n"
        )
        with pytest.raises(ValueError, match="More than one"):
            WireguardConfig.from_wgconfig(StringIO(bad))
