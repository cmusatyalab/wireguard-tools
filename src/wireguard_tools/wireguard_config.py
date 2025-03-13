#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

from __future__ import annotations

import json
import re
from ipaddress import (
    IPv4Address,
    IPv4Interface,
    IPv6Address,
    IPv6Interface,
    ip_address,
    ip_interface,
)
from typing import Any, Sequence, TextIO, TypeVar, Union

from attrs import asdict, define, field
from attrs.converters import optional
from attrs.setters import convert as setters_convert
from segno import QRCode, make_qr

from .wireguard_key import WireguardKey

SimpleJsonTypes = Union[str, int, float, bool, None]
T = TypeVar("T")


def _ipaddress_or_host(
    host: IPv4Address | IPv6Address | str,
) -> IPv4Address | IPv6Address | str:
    if isinstance(host, (IPv4Address, IPv6Address)):
        return host
    try:
        return ip_address(host.lstrip("[").rstrip("]"))
    except ValueError:
        return host


def _list_of_ipaddress(
    hosts: Sequence[IPv4Address | IPv6Address | str],
) -> Sequence[IPv4Address | IPv6Address]:
    return [ip_address(host) for host in hosts]


def _list_of_ipinterface(
    hosts: Sequence[IPv4Interface | IPv6Interface | str],
) -> Sequence[IPv4Interface | IPv6Interface]:
    return [ip_interface(host) for host in hosts]


@define(on_setattr=setters_convert)
class WireguardPeer:
    public_key: WireguardKey = field(converter=WireguardKey)
    preshared_key: WireguardKey | None = field(
        converter=optional(WireguardKey),
        default=None,
    )
    endpoint_host: IPv4Address | IPv6Address | str | None = field(
        converter=optional(_ipaddress_or_host),
        default=None,
    )
    endpoint_port: int | None = field(converter=optional(int), default=None)
    persistent_keepalive: int | None = field(converter=optional(int), default=None)
    allowed_ips: list[IPv4Interface | IPv6Interface] = field(
        converter=_list_of_ipinterface,
        factory=list,
    )
    # comment tags that can be parsed by prometheus-wireguard-exporter
    friendly_name: str | None = None
    friendly_json: dict[str, SimpleJsonTypes] | None = None

    # peer statistics from device
    last_handshake: float | None = field(
        converter=optional(float),
        default=None,
        eq=False,
    )
    rx_bytes: int | None = field(converter=optional(int), default=None, eq=False)
    tx_bytes: int | None = field(converter=optional(int), default=None, eq=False)

    @classmethod
    def from_dict(cls, config_dict: dict[str, Any]) -> WireguardPeer:
        endpoint = config_dict.pop("endpoint", None)
        if endpoint is not None:
            host, port = endpoint.rsplit(":", 1)
            config_dict["endpoint_host"] = host
            config_dict["endpoint_port"] = int(port)
        return cls(**config_dict)

    def asdict(self) -> dict[str, Any]:
        def _filter(_attr: Any, value: Any) -> bool:
            return value is not None

        def _serializer(_instance: type, _field: Any, value: T) -> T | str:
            if isinstance(
                value,
                (IPv4Address, IPv4Interface, IPv6Address, IPv6Interface, WireguardKey),
            ):
                return str(value)
            return value

        return asdict(self, filter=_filter, value_serializer=_serializer)

    @classmethod
    def from_wgconfig(cls, config: Sequence[tuple[str, str]]) -> WireguardPeer:
        conf: dict[str, Any] = {}
        for key_, value in config:
            key = key_.lower()
            if key == "publickey":
                conf["public_key"] = WireguardKey(value)
            elif key == "presharedkey":
                conf["preshared_key"] = WireguardKey(value)
            elif key == "endpoint":
                host, port = value.rsplit(":", 1)
                conf["endpoint_host"] = host
                conf["endpoint_port"] = int(port)
            elif key == "persistentkeepalive":
                conf["persistent_keepalive"] = int(value)
            elif key == "allowedips":
                conf.setdefault("allowed_ips", []).extend(
                    ip_interface(addr.strip()) for addr in value.split(",")
                )
            elif key == "# friendly_name":
                conf["friendly_name"] = value
            elif key == "# friendly_json":
                conf["friendly_json"] = json.loads(value)
        return cls(**conf)

    def as_wgconfig_snippet(self) -> list[str]:
        conf = ["\n[Peer]"]
        if self.friendly_name:
            conf.append(f"# friendly_name = {self.friendly_name}")
        if self.friendly_json is not None:
            value = json.dumps(self.friendly_json)
            conf.append(f"# friendly_json = {value}")
        conf.append(f"PublicKey = {self.public_key}")
        if self.preshared_key:
            conf.append(f"PresharedKey = {self.preshared_key}")
        if self.endpoint_host:
            conf.append(f"Endpoint = {self.endpoint_host}:{self.endpoint_port}")
        if self.persistent_keepalive:
            conf.append(f"PersistentKeepalive = {self.persistent_keepalive}")
        conf.extend([f"AllowedIPs = {addr}" for addr in self.allowed_ips])
        return conf

    def __str__(self) -> str:
        desc = [f"peer: {self.public_key}"]
        if self.preshared_key:
            desc.append(f"  preshared key: {self.preshared_key}")
        if self.endpoint_host:
            desc.append(f"  endpoint: {self.endpoint_host}:{self.endpoint_port}")
        if self.persistent_keepalive:
            desc.append(f"  persistent keepalive: {self.persistent_keepalive}")
        if self.allowed_ips:
            allowed_ips = ", ".join(str(addr) for addr in self.allowed_ips)
            desc.append(f"  allowed ips: {allowed_ips}")
        if self.last_handshake:
            desc.append(f"  last handshake: {self.last_handshake}")
        if self.rx_bytes and self.tx_bytes:
            desc.append(
                "  transfer:"
                f" {self.rx_bytes / 1024:.2f} KiB received, "
                f" {self.tx_bytes / 1024:.2f} KiB sent",
            )
        return "\n".join(desc)


@define(on_setattr=setters_convert)
class WireguardConfig:
    private_key: WireguardKey | None = field(
        converter=optional(WireguardKey),
        default=None,
        repr=lambda _: "(hidden)",
    )
    fwmark: int | None = field(converter=optional(int), default=None)
    listen_port: int | None = field(converter=optional(int), default=None)
    peers: dict[WireguardKey, WireguardPeer] = field(factory=dict)

    # wg-quick format extensions
    addresses: list[IPv4Interface | IPv6Interface] = field(
        converter=_list_of_ipinterface,
        factory=list,
    )
    dns_servers: list[IPv4Address | IPv6Address] = field(
        converter=_list_of_ipaddress,
        factory=list,
    )
    search_domains: list[str] = field(factory=list)
    mtu: int | None = field(converter=optional(int), default=None)
    table: str | None = field(default=None)
    preup: list[str] = field(factory=list)
    postup: list[str] = field(factory=list)
    predown: list[str] = field(factory=list)
    postdown: list[str] = field(factory=list)
    saveconfig: bool = field(default=False)

    # wireguard-android specific extensions
    included_applications: list[str] = field(factory=list)
    excluded_applications: list[str] = field(factory=list)

    @classmethod
    def from_dict(cls, config_dict: dict[str, Any]) -> WireguardConfig:
        config_dict = config_dict.copy()

        dns = config_dict.pop("dns", [])
        peers = config_dict.pop("peers", [])

        config = cls(**config_dict)

        for item in dns:
            config._add_dns_entry(item)

        for peer_dict in peers:
            peer = WireguardPeer.from_dict(peer_dict)
            config.add_peer(peer)
        return config

    def asdict(self) -> dict[str, Any]:
        def _filter(_attr: Any, value: Any) -> bool:
            return value is not None

        def _serializer(
            _instance: type,
            _field: Any,
            value: T,
        ) -> list[dict[str, Any]] | T | str:
            if isinstance(value, dict):
                return list(value.values())
            if isinstance(
                value,
                (IPv4Address, IPv4Interface, IPv6Address, IPv6Interface, WireguardKey),
            ):
                return str(value)
            return value

        return asdict(self, filter=_filter, value_serializer=_serializer)

    @classmethod
    def from_wgconfig(cls, configfile: TextIO) -> WireguardConfig:
        text = configfile.read()
        _pre, *parts = re.split(
            r"^\[(Interface|Peer)\]$",
            text,
            flags=re.IGNORECASE | re.MULTILINE,
        )
        sections = [section.lower() for section in parts[0::2]]
        if sections.count("interface") > 1:
            msg = "More than one [Interface] section in config file"
            raise ValueError(msg)

        config = cls()
        for section, content in zip(sections, parts[1::2]):
            key_value = [
                (match.group(1), match.group(3))
                for match in re.finditer(
                    r"^((# )?\w+)\s*=\s*(.+)$",
                    content,
                    re.MULTILINE,
                )
            ]
            if section == "interface":
                config._update_from_conf(key_value)
            else:
                peer = WireguardPeer.from_wgconfig(key_value)
                config.add_peer(peer)
        return config

    def _update_from_conf(self, key_value: Sequence[tuple[str, str]]) -> None:
        for key_, value in key_value:
            key = key_.lower()
            if key == "privatekey":
                self.private_key = WireguardKey(value)
            elif key == "fwmark":
                self.fwmark = int(value)
            elif key == "listenport":
                self.listen_port = int(value)
            # wg-quick specific extensions
            elif key == "address":
                self.addresses.extend(
                    ip_interface(addr.strip()) for addr in value.split(",")
                )
            elif key == "dns":
                for item in value.split(","):
                    self._add_dns_entry(item.strip())
            elif key == "mtu":
                self.mtu = int(value)
            elif key == "table":
                self.table = value
            elif key == "preup":
                self.preup.append(value)
            elif key == "postup":
                self.postup.append(value)
            elif key == "predown":
                self.predown.append(value)
            elif key == "postdown":
                self.postdown.append(value)
            elif key == "saveconfig":
                self.saveconfig = value == "true"
            # wireguard-android specific extensions
            elif key == "includedapplications":
                self.included_applications.extend(
                    item.strip() for item in value.split(",")
                )
            elif key == "excludedapplications":
                self.excluded_applications.extend(
                    item.strip() for item in value.split(",")
                )

    def _add_dns_entry(self, item: str) -> None:
        try:
            self.dns_servers.append(ip_address(item))
        except ValueError:
            self.search_domains.append(item)

    def add_peer(self, peer: WireguardPeer) -> None:
        self.peers[peer.public_key] = peer

    def del_peer(self, peer_key: WireguardKey) -> None:
        del self.peers[peer_key]

    def to_wgconfig(self, *, wgquick_format: bool = False) -> str:
        conf = ["[Interface]"]
        if self.private_key is not None:
            conf.append(f"PrivateKey = {self.private_key}")
        if self.listen_port is not None:
            conf.append(f"ListenPort = {self.listen_port}")
        if self.fwmark is not None:
            conf.append(f"FwMark = {self.fwmark}")
        if wgquick_format:
            if self.mtu is not None:
                conf.append(f"MTU = {self.mtu}")
            conf.extend([f"Address = {addr}" for addr in self.addresses])
            conf.extend([f"DNS = {addr}" for addr in self.dns_servers])
            conf.extend([f"DNS = {domain}" for domain in self.search_domains])
            if self.table is not None:
                conf.append(f"Table = {self.table}")
            conf.extend([f"PreUp = {cmd}" for cmd in self.preup])
            conf.extend([f"PostUp = {cmd}" for cmd in self.postup])
            conf.extend([f"PreDown = {cmd}" for cmd in self.predown])
            conf.extend([f"PostDown = {cmd}" for cmd in self.postdown])
            if self.saveconfig:
                conf.append("SaveConfig = true")

            # wireguard-android specific extensions
            if self.included_applications:
                apps = ", ".join(self.included_applications)
                conf.append(f"IncludedApplications = {apps}")
            if self.excluded_applications:
                apps = ", ".join(self.excluded_applications)
                conf.append(f"ExcludedApplications = {apps}")
        for peer in self.peers.values():
            conf.extend(peer.as_wgconfig_snippet())
        conf.append("")
        return "\n".join(conf)

    def to_resolvconf(self, opt_ndots: int | None = None) -> str:
        conf = [f"nameserver {addr}" for addr in self.dns_servers]
        if self.search_domains:
            search_domains = " ".join(self.search_domains)
            conf.append(f"search {search_domains}")
        if opt_ndots is not None:
            conf.append(f"options ndots:{opt_ndots}")
        conf.append("")
        return "\n".join(conf)

    def to_qrcode(self) -> QRCode:
        config = self.to_wgconfig(wgquick_format=True)
        return make_qr(config, mode="byte", encoding="utf-8", eci=True)

    def __str__(self) -> str:
        desc = []
        if self.private_key is not None:
            desc.append(f"  public key: {self.private_key.public_key()}")
            desc.append("  private key: (hidden)")
        if self.listen_port is not None:
            desc.append(f"  listening port: {self.listen_port}")
        if self.fwmark is not None:
            desc.append(f"  fwmark: {self.fwmark}")
        for peer in self.peers.values():
            desc.append("")
            desc.append(str(peer))
        return "\n".join(desc)
