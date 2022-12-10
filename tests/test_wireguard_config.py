# Copyright (c) 2022 Carnegie Mellon University
# SPDX-License-Identifier: MIT

# import copy
from io import StringIO

import pytest

from wireguard_tools.wireguard_config import WireguardConfig

IFNAME = "wg-test"
UUID = "00000000-0000-0000-0000-000000000000"
TUNNEL_WGQUICK = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
Address = 10.0.0.2/32
DNS = 10.0.0.1
DNS = test.svc.cluster.local

[Peer]
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
Endpoint = 127.0.0.1:51820
PersistentKeepalive = 30
AllowedIPs = 10.0.0.1/32
"""
TUNNEL_WGCONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=

[Peer]
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
Endpoint = 127.0.0.1:51820
PersistentKeepalive = 30
AllowedIPs = 10.0.0.1/32
"""
TUNNEL_RESOLV_CONF = """\
nameserver 10.0.0.1
search test.svc.cluster.local
options ndots:5
"""


@pytest.fixture(scope="session")
def wgconfig() -> WireguardConfig:
    conffile = StringIO(TUNNEL_WGQUICK)
    return WireguardConfig.from_wgconfig(conffile)


def test_create_wgquick_config(wgconfig: WireguardConfig) -> None:
    assert wgconfig.to_wgconfig(wgquick_format=True) == TUNNEL_WGQUICK


def test_create_wireguard_config(wgconfig: WireguardConfig) -> None:
    assert wgconfig.to_wgconfig() == TUNNEL_WGCONFIG


def test_create_resolv_conf(wgconfig: WireguardConfig) -> None:
    assert wgconfig.to_resolvconf(opt_ndots=5) == TUNNEL_RESOLV_CONF
