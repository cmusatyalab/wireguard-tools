# Tests for the wg_quick module.
# SPDX-License-Identifier: MIT

from io import StringIO
from ipaddress import IPv4Network, IPv6Network, ip_interface
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from wireguard_tools.wg_quick import (
    WgQuickError,
    _collect_allowed_networks,
    _find_config,
    _resolve_table,
)
from wireguard_tools.wireguard_config import WireguardConfig, WireguardPeer
from wireguard_tools.wireguard_key import WireguardKey


SAMPLE_CONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
Address = 10.0.0.2/24
ListenPort = 51820
DNS = 1.1.1.1

[Peer]
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
Endpoint = 192.168.1.1:51820
AllowedIPs = 10.0.0.0/24, 10.1.0.0/16
PersistentKeepalive = 25
"""

CATCHALL_CONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
Endpoint = 192.168.1.1:51820
AllowedIPs = 0.0.0.0/0, ::/0
"""


class TestFindConfig:
    def test_finds_by_conf_path(self, tmp_path: Path) -> None:
        conf = tmp_path / "wg0.conf"
        conf.write_text(SAMPLE_CONFIG)
        ifname, path = _find_config(str(conf))
        assert ifname == "wg0"
        assert path == conf

    def test_raises_for_missing(self) -> None:
        with pytest.raises(WgQuickError, match="not found"):
            _find_config("nonexistent-interface-xyz")


class TestResolveTable:
    def test_table_off(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(SAMPLE_CONFIG))
        config.table = "off"
        assert _resolve_table(config, "wg0") is None

    def test_table_explicit_number(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(SAMPLE_CONFIG))
        config.table = "42"
        assert _resolve_table(config, "wg0") == 42

    def test_table_auto_no_catchall(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(SAMPLE_CONFIG))
        config.table = "auto"
        assert _resolve_table(config, "wg0") is None

    @patch("wireguard_tools.wg_quick.pyroute2.IPRoute")
    def test_table_auto_with_catchall(self, mock_iproute: MagicMock) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(CATCHALL_CONFIG))
        config.table = "auto"
        mock_ctx = MagicMock()
        mock_ctx.link_lookup.return_value = [42]
        mock_iproute.return_value.__enter__ = lambda _: mock_ctx
        mock_iproute.return_value.__exit__ = lambda *_: None
        assert _resolve_table(config, "wg0") == 42


class TestCollectAllowedNetworks:
    def test_unique_networks(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(SAMPLE_CONFIG))
        nets = _collect_allowed_networks(config)
        assert len(nets) == 2
        assert IPv4Network("10.0.0.0/24") in nets
        assert IPv4Network("10.1.0.0/16") in nets

    def test_catchall_networks(self) -> None:
        config = WireguardConfig.from_wgconfig(StringIO(CATCHALL_CONFIG))
        nets = _collect_allowed_networks(config)
        assert IPv4Network("0.0.0.0/0") in nets
        assert IPv6Network("::/0") in nets

    def test_deduplicates(self) -> None:
        config = WireguardConfig()
        key1 = WireguardKey.generate()
        key2 = WireguardKey.generate()
        config.add_peer(
            WireguardPeer(
                public_key=key1,
                allowed_ips=[ip_interface("10.0.0.0/24")],
            )
        )
        config.add_peer(
            WireguardPeer(
                public_key=key2,
                allowed_ips=[ip_interface("10.0.0.0/24")],
            )
        )
        nets = _collect_allowed_networks(config)
        assert len(nets) == 1


class TestUpDown:
    @patch("wireguard_tools.wg_quick._interface_exists", return_value=True)
    def test_up_fails_if_interface_exists(self, mock_exists: MagicMock, tmp_path: Path) -> None:
        conf = tmp_path / "wg0.conf"
        conf.write_text(SAMPLE_CONFIG)
        with pytest.raises(WgQuickError, match="already exists"):
            from wireguard_tools.wg_quick import up

            up(str(conf))

    @patch("wireguard_tools.wg_quick._interface_exists", return_value=False)
    def test_down_fails_if_interface_not_up(
        self, mock_exists: MagicMock, tmp_path: Path
    ) -> None:
        conf = tmp_path / "wg0.conf"
        conf.write_text(SAMPLE_CONFIG)
        with pytest.raises(WgQuickError, match="not currently up"):
            from wireguard_tools.wg_quick import down

            down(str(conf))
