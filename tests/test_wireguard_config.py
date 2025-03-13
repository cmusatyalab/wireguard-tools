# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT

from io import StringIO
from ipaddress import IPv4Address, IPv4Interface, IPv6Address, IPv6Interface

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
FRIENDLY_TAGS_DICT = {
    "private_key": "DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=",
    "addresses": ["10.0.0.2/32"],
    "dns": ["10.0.0.1", "test.svc.cluster.local"],
    "peers": [
        {
            "friendly_name": "Friendly Peer",
            "friendly_json": {"mood": "happy", "attitude": "friendly"},
            "public_key": "ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=",
            "endpoint": "127.0.0.1:51820",
            "persistent_keepalive": 30,
            "allowed_ips": ["10.0.0.1/32"],
        },
    ],
}
MULTI_ADDR_CONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
Address = 10.0.0.2/32
DNS = 10.0.0.1,test.svc.cluster.local

[Peer]
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
Endpoint = 127.0.0.1:51820
PersistentKeepalive = 30
AllowedIPs = 10.0.0.1/32 , 10.2.0.1/16
"""
IPV6_ADDR_CONFIG = """\
[Interface]
PrivateKey = DnLEmfJzVoCRJYXzdSXIhTqnjygnhh6O+I3ErMS6OUg=
Address = 10.0.0.2/32, 2001:db8:1::2/128
DNS = 10.0.0.1,test.svc.cluster.local

[Peer]
PublicKey = ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=
Endpoint = [2001:db8::1]:51820
PersistentKeepalive = 30
AllowedIPs = 10.0.0.1/32, 2001:db8:1::1/64
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


def test_wgconfig_multiple_addresses() -> None:
    # test if we correctly parse a list of addresses
    conffile = StringIO(MULTI_ADDR_CONFIG)
    wgconfig = WireguardConfig.from_wgconfig(conffile)

    assert len(wgconfig.dns_servers) == 1
    assert IPv4Address("10.0.0.1") in wgconfig.dns_servers
    assert len(wgconfig.search_domains) == 1
    assert "test.svc.cluster.local" in wgconfig.search_domains

    peer_key = WireguardKey("ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=")
    assert peer_key in wgconfig.peers
    peer = wgconfig.peers[peer_key]

    assert len(peer.allowed_ips) == 2
    assert IPv4Interface("10.0.0.1/32") in peer.allowed_ips
    assert IPv4Interface("10.2.0.1/16") in peer.allowed_ips


def test_wgconfig_ipv6_addresses() -> None:
    # test if we correctly parse ipv6 addresses
    conffile = StringIO(IPV6_ADDR_CONFIG)
    wgconfig = WireguardConfig.from_wgconfig(conffile)

    assert len(wgconfig.addresses) == 2
    assert IPv4Interface("10.0.0.2/32") in wgconfig.addresses
    assert IPv6Interface("2001:db8:1::2/128") in wgconfig.addresses

    peer_key = WireguardKey("ba8AwcolBVDuhR/MKFU8O6CZrAjh7c20h6EOnQx0VRE=")
    assert peer_key in wgconfig.peers
    peer = wgconfig.peers[peer_key]

    assert peer.endpoint_host == IPv6Address("2001:db8::1")
    assert peer.endpoint_port == 51820
    assert len(peer.allowed_ips) == 2
    assert IPv4Interface("10.0.0.1/32") in peer.allowed_ips
    assert IPv6Interface("2001:db8:1::1/64") in peer.allowed_ips
