# Copyright (c) 2022 Carnegie Mellon University
# SPDX-License-Identifier: MIT

# import copy
from io import StringIO

import pytest

from wireguard_tools.wireguard_config import WireguardConfig
from wireguard_tools.wireguard_key import WireguardKey

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
FRIENDLY_TAGS_CONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
Address = 10.0.0.2/32
DNS = 10.0.0.1
DNS = test.svc.cluster.local

[Peer]
# friendly_name = Friendly Peer
# friendly_json = {"mood": "happy", "attitude": "friendly"}
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
Endpoint = 127.0.0.1:51820
PersistentKeepalive = 30
AllowedIPs = 10.0.0.1/32
"""
FRIENDLY_TAGS_DICT = dict(
    private_key="DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=",
    addresses=["10.0.0.2/32"],
    dns=["10.0.0.1", "test.svc.cluster.local"],
    peers=[
        dict(
            friendly_name="Friendly Peer",
            friendly_json=dict(mood="happy", attitude="friendly"),
            public_key="ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=",
            endpoint="127.0.0.1:51820",
            persistent_keepalive=30,
            allowed_ips=["10.0.0.1/32"],
        ),
    ],
)


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


def test_default_friendly_tags(wgconfig: WireguardConfig) -> None:
    peer_key = WireguardKey("ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=")
    assert peer_key in wgconfig.peers
    assert wgconfig.peers[peer_key].friendly_name is None
    assert wgconfig.peers[peer_key].friendly_json is None


def test_friendly_tags_from_wgconfig() -> None:
    conffile = StringIO(FRIENDLY_TAGS_CONFIG)
    wgconfig = WireguardConfig.from_wgconfig(conffile)

    peer_key = WireguardKey("ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=")
    assert peer_key in wgconfig.peers
    peer = wgconfig.peers[peer_key]

    assert peer.friendly_name is not None
    assert peer.friendly_name == "Friendly Peer"

    assert peer.friendly_json is not None
    assert sorted(peer.friendly_json.keys()) == ["attitude", "mood"]
    assert peer.friendly_json["mood"] == "happy"


def test_wgconfig_from_dict() -> None:
    wgconfig = WireguardConfig.from_dict(FRIENDLY_TAGS_DICT)
    assert wgconfig.to_wgconfig(wgquick_format=True) == FRIENDLY_TAGS_CONFIG
