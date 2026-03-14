#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

"""Data-model classes for WireGuard interface and peer configuration.

This module provides :class:`WireguardConfig` and :class:`WireguardPeer`,
attrs-based data classes that represent a complete WireGuard interface
configuration.  Configurations can be round-tripped through the INI-style
``wg(8)``/``wg-quick(8)`` config format, plain dictionaries (suitable for
JSON serialisation), and QR codes consumed by mobile clients.

The module also supports wg-quick extensions (addresses, DNS, routing table,
pre/post hooks) and wireguard-android extensions (included/excluded
applications).
"""

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


def _parse_endpoint(value: str) -> tuple[str, int]:
    """Parse an endpoint address string into a host/port pair.

    Handles both plain ``host:port`` notation and IPv6 bracket notation
    ``[host]:port``.

    :param value: Endpoint string, e.g. ``"203.0.113.1:51820"`` or
        ``"[2001:db8::1]:51820"``.
    :returns: A ``(host, port)`` tuple where *host* is the bare address
        string (brackets stripped) and *port* is the numeric port.
    :rtype: tuple[str, int]
    :raises ValueError: If the port component is not a valid integer.
    :raises ValueError: If bracket notation is malformed (missing ``]``).
    """
    if value.startswith("["):
        bracket_end = value.index("]")
        host = value[1:bracket_end]
        port = int(value[bracket_end + 2 :])
    else:
        host, port_str = value.rsplit(":", 1)
        port = int(port_str)
    return host, port


def _split_comma_list(value: str) -> list[str]:
    """Split a comma-separated string into a list of stripped, non-empty items.

    Leading/trailing whitespace around each item is stripped and empty
    entries (e.g. from trailing commas) are silently discarded.

    :param value: Comma-separated string, e.g. ``"10.0.0.1, 10.0.0.2,"``.
    :returns: List of non-empty stripped strings.
    :rtype: list[str]
    """
    return [item for item in (s.strip() for s in value.split(",")) if item]


def _ipaddress_or_host(
    host: IPv4Address | IPv6Address | str,
) -> IPv4Address | IPv6Address | str:
    """Coerce a value to an IP address, falling back to a plain hostname string.

    If *host* is already an :class:`~ipaddress.IPv4Address` or
    :class:`~ipaddress.IPv6Address` it is returned as-is.  String values are
    first stripped of surrounding brackets (to handle ``[IPv6]`` notation)
    and then parsed; if parsing fails the original string is returned
    unchanged, allowing DNS hostnames to pass through.

    :param host: IP address object or string representation of an address
        or hostname.
    :returns: Parsed IP address, or the original string if it cannot be
        parsed as an address.
    :rtype: IPv4Address | IPv6Address | str
    """
    if isinstance(host, (IPv4Address, IPv6Address)):
        return host
    try:
        return ip_address(host.lstrip("[").rstrip("]"))
    except ValueError:
        return host


def _list_of_ipaddress(
    hosts: Sequence[IPv4Address | IPv6Address | str],
) -> Sequence[IPv4Address | IPv6Address]:
    """Convert a sequence of address-like values to a list of IP address objects.

    :param hosts: Sequence of :class:`~ipaddress.IPv4Address`,
        :class:`~ipaddress.IPv6Address`, or string representations.
    :returns: List of parsed IP address objects.
    :rtype: Sequence[IPv4Address | IPv6Address]
    :raises ValueError: If any element cannot be parsed as an IP address.
    """
    return [ip_address(host) for host in hosts]


def _list_of_ipinterface(
    hosts: Sequence[IPv4Interface | IPv6Interface | str],
) -> Sequence[IPv4Interface | IPv6Interface]:
    """Convert a sequence of interface-like values to a list of IP interface objects.

    :param hosts: Sequence of :class:`~ipaddress.IPv4Interface`,
        :class:`~ipaddress.IPv6Interface`, or string representations
        (e.g. ``"10.0.0.1/24"``).
    :returns: List of parsed IP interface objects.
    :rtype: Sequence[IPv4Interface | IPv6Interface]
    :raises ValueError: If any element cannot be parsed as an IP interface.
    """
    return [ip_interface(host) for host in hosts]


@define(on_setattr=setters_convert)
class WireguardPeer:
    """A single WireGuard peer entry.

    Each peer is identified by its :attr:`public_key` and optionally carries
    an :attr:`endpoint_host`/:attr:`endpoint_port` pair, a
    :attr:`preshared_key`, a :attr:`persistent_keepalive` interval, and a
    list of :attr:`allowed_ips` (CIDR networks routed through this peer).

    The :attr:`friendly_name` and :attr:`friendly_json` fields store
    comment-based metadata compatible with
    `prometheus-wireguard-exporter
    <https://github.com/MindFlavor/prometheus_wireguard_exporter>`_,
    which embeds them as ``# friendly_name`` / ``# friendly_json`` comment
    lines in the config file.

    Runtime statistics (:attr:`last_handshake`, :attr:`rx_bytes`,
    :attr:`tx_bytes`) are populated when a peer is read from a live device
    and are excluded from equality comparisons.
    """

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
        """Construct a :class:`WireguardPeer` from a plain dictionary.

        If the dictionary contains an ``"endpoint"`` key (e.g.
        ``"203.0.113.1:51820"``), it is parsed and split into
        ``endpoint_host`` / ``endpoint_port`` before construction.

        :param config_dict: Dictionary of peer attributes.  Keys should match
            constructor parameter names, except ``endpoint`` which is
            automatically split.  **Modified in place** (the ``endpoint`` key
            is popped).
        :returns: New peer instance.
        :rtype: WireguardPeer
        """
        endpoint = config_dict.pop("endpoint", None)
        if endpoint is not None:
            host, port = _parse_endpoint(endpoint)
            config_dict["endpoint_host"] = host
            config_dict["endpoint_port"] = port
        return cls(**config_dict)

    def asdict(self) -> dict[str, Any]:
        """Serialise this peer to a plain dictionary.

        ``None`` values are omitted, and IP address / key objects are
        converted to their string representations so the result is directly
        JSON-serialisable.

        :returns: Dictionary of non-``None`` peer attributes.
        :rtype: dict[str, Any]
        """

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
        """Construct a :class:`WireguardPeer` from parsed config key-value pairs.

        Accepts the sequence of ``(key, value)`` string tuples extracted from
        a ``[Peer]`` section of a ``wg(8)`` configuration file.  Keys are
        matched case-insensitively.  ``AllowedIPs`` entries are accumulated
        across multiple lines.

        Comment-based tags ``# friendly_name`` and ``# friendly_json`` are
        recognised for prometheus-wireguard-exporter compatibility.

        :param config: Ordered sequence of ``(key, value)`` pairs from the
            config section.
        :returns: New peer instance.
        :rtype: WireguardPeer
        :raises KeyError: If a required key (e.g. ``PublicKey``) is missing
            from *config*.
        """
        conf: dict[str, Any] = {}
        for key_, value in config:
            key = key_.lower()
            if key == "publickey":
                conf["public_key"] = WireguardKey(value)
            elif key == "presharedkey":
                conf["preshared_key"] = WireguardKey(value)
            elif key == "endpoint":
                host, port = _parse_endpoint(value)
                conf["endpoint_host"] = host
                conf["endpoint_port"] = port
            elif key == "persistentkeepalive":
                conf["persistent_keepalive"] = int(value)
            elif key == "allowedips":
                conf.setdefault("allowed_ips", []).extend(
                    ip_interface(addr) for addr in _split_comma_list(value)
                )
            elif key == "# friendly_name":
                conf["friendly_name"] = value
            elif key == "# friendly_json":
                conf["friendly_json"] = json.loads(value)
        return cls(**conf)

    def as_wgconfig_snippet(self) -> list[str]:
        """Render this peer as lines for a ``wg(8)`` configuration file.

        The returned list starts with a blank line and the ``[Peer]`` section
        header, followed by all configured fields.  IPv6 endpoint addresses
        are wrapped in brackets.

        :returns: List of configuration file lines (without trailing newlines).
        :rtype: list[str]
        """
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
            host = self.endpoint_host
            if isinstance(host, IPv6Address):
                conf.append(f"Endpoint = [{host}]:{self.endpoint_port}")
            else:
                conf.append(f"Endpoint = {host}:{self.endpoint_port}")
        if self.persistent_keepalive:
            conf.append(f"PersistentKeepalive = {self.persistent_keepalive}")
        conf.extend([f"AllowedIPs = {addr}" for addr in self.allowed_ips])
        return conf

    def __str__(self) -> str:
        """Return a human-readable summary of the peer, similar to ``wg show`` output.

        :returns: Multi-line string describing the peer's key, endpoint,
            keepalive, allowed IPs, handshake time, and transfer statistics.
        :rtype: str
        """
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
    """Complete configuration for a WireGuard interface.

    Holds the interface-level settings (:attr:`private_key`,
    :attr:`listen_port`, :attr:`fwmark`) and a mapping of :attr:`peers`
    keyed by their :class:`~wireguard_tools.wireguard_key.WireguardKey`.

    In addition to the core WireGuard settings, this class models
    **wg-quick extensions** (:attr:`addresses`, :attr:`dns_servers`,
    :attr:`search_domains`, :attr:`mtu`, :attr:`table`,
    :attr:`preup`/:attr:`postup`/:attr:`predown`/:attr:`postdown` hooks,
    :attr:`saveconfig`) and **wireguard-android extensions**
    (:attr:`included_applications`, :attr:`excluded_applications`).

    Instances can be created from dictionaries (:meth:`from_dict`),
    ``wg(8)``-style config files (:meth:`from_wgconfig`), and serialised
    back via :meth:`to_wgconfig`, :meth:`asdict`, or :meth:`to_qrcode`.
    """

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
        """Construct a :class:`WireguardConfig` from a plain dictionary.

        The ``"dns"`` key, if present, is split into :attr:`dns_servers` and
        :attr:`search_domains` via :meth:`_add_dns_entry`.  The ``"peers"``
        list is converted to :class:`WireguardPeer` instances.  All other
        keys are forwarded to the constructor.

        :param config_dict: Dictionary of interface attributes.  **Not
            modified** (a shallow copy is made).
        :returns: New config instance.
        :rtype: WireguardConfig
        """
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
        """Serialise this configuration to a plain dictionary.

        ``None`` values are omitted.  The :attr:`peers` mapping is converted
        to a list of peer dictionaries.  IP address and key objects are
        stringified so the result is directly JSON-serialisable.

        :returns: Dictionary of non-``None`` interface and peer attributes.
        :rtype: dict[str, Any]
        """

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
        """Parse a ``wg(8)``/``wg-quick(8)`` configuration file.

        The file is split on ``[Interface]`` and ``[Peer]`` section headers.
        Exactly one ``[Interface]`` section is expected; multiple ``[Peer]``
        sections are supported.

        :param configfile: Readable text stream positioned at the start of a
            WireGuard configuration file.
        :returns: New config instance.
        :rtype: WireguardConfig
        :raises ValueError: If the file contains more than one
            ``[Interface]`` section.
        """
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
        """Apply parsed key-value pairs from an ``[Interface]`` section.

        Recognised keys are mapped to their corresponding attributes.
        ``wg-quick`` extensions (``Address``, ``DNS``, ``MTU``, ``Table``,
        ``PreUp``/``PostUp``/``PreDown``/``PostDown``, ``SaveConfig``) and
        ``wireguard-android`` extensions (``IncludedApplications``,
        ``ExcludedApplications``) are processed when present.

        :param key_value: Ordered sequence of ``(key, value)`` string pairs.
        """
        for key_, value in key_value:
            key = key_.lower()
            if key == "privatekey":
                self.private_key = WireguardKey(value)
            elif key == "fwmark":
                self.fwmark = int(value, 0)
            elif key == "listenport":
                self.listen_port = int(value)
            # wg-quick specific extensions
            elif key == "address":
                self.addresses.extend(
                    ip_interface(addr) for addr in _split_comma_list(value)
                )
            elif key == "dns":
                for item in _split_comma_list(value):
                    self._add_dns_entry(item)
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
                self.saveconfig = value.lower() == "true"
            # wireguard-android specific extensions
            elif key == "includedapplications":
                self.included_applications.extend(_split_comma_list(value))
            elif key == "excludedapplications":
                self.excluded_applications.extend(_split_comma_list(value))

    def _add_dns_entry(self, item: str) -> None:
        """Classify and store a single DNS entry.

        If *item* can be parsed as an IP address it is appended to
        :attr:`dns_servers`; otherwise it is treated as a search domain and
        appended to :attr:`search_domains`.

        :param item: IP address string or DNS search domain.
        """
        try:
            self.dns_servers.append(ip_address(item))
        except ValueError:
            self.search_domains.append(item)

    def add_peer(self, peer: WireguardPeer) -> None:
        """Add or replace a peer in this configuration.

        The peer is stored under its :attr:`~WireguardPeer.public_key`.  If a
        peer with the same key already exists it is silently replaced.

        :param peer: Peer instance to add.
        """
        self.peers[peer.public_key] = peer

    def del_peer(self, peer_key: WireguardKey) -> None:
        """Remove a peer by its public key.

        :param peer_key: Public key of the peer to remove.
        :raises KeyError: If no peer with *peer_key* exists.
        """
        del self.peers[peer_key]

    def to_wgconfig(self, *, wgquick_format: bool = False) -> str:
        """Render this configuration as a ``wg(8)`` INI-style config string.

        When *wgquick_format* is ``True``, wg-quick and wireguard-android
        extensions (addresses, DNS, MTU, hooks, included/excluded
        applications, etc.) are included in the output.  Otherwise only core
        WireGuard directives are emitted.

        :param wgquick_format: Include wg-quick and Android extensions.
            Defaults to ``False``.
        :returns: Complete configuration file content, terminated by a
            trailing newline.
        :rtype: str
        """
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
        """Generate a ``resolv.conf(5)``-style string from DNS settings.

        Includes ``nameserver`` lines for each entry in :attr:`dns_servers`,
        a ``search`` line if :attr:`search_domains` is non-empty, and an
        optional ``options ndots:N`` directive.

        :param opt_ndots: If not ``None``, an ``ndots`` option is appended.
        :returns: ``resolv.conf`` content terminated by a trailing newline.
        :rtype: str
        """
        conf = [f"nameserver {addr}" for addr in self.dns_servers]
        if self.search_domains:
            search_domains = " ".join(self.search_domains)
            conf.append(f"search {search_domains}")
        if opt_ndots is not None:
            conf.append(f"options ndots:{opt_ndots}")
        conf.append("")
        return "\n".join(conf)

    def to_qrcode(self) -> QRCode:
        """Encode this configuration as a QR code suitable for mobile clients.

        The full wg-quick format (including extensions) is encoded as a
        UTF-8 byte-mode QR code using :func:`segno.make_qr`.

        :returns: A :class:`segno.QRCode` object that can be saved or
            displayed.
        :rtype: segno.QRCode
        """
        config = self.to_wgconfig(wgquick_format=True)
        return make_qr(config, mode="byte", encoding="utf-8", eci=True)

    def __str__(self) -> str:
        """Return a human-readable summary, similar to ``wg show`` output.

        :returns: Multi-line string describing the interface and its peers.
        :rtype: str
        """
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
