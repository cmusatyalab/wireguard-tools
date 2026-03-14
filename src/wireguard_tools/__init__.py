#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#
"""Pure-Python reimplementation of WireGuard userspace tools.

This package provides a portable, dependency-light interface to
WireGuard configuration, key management, and device control without
requiring the C ``wireguard-tools`` binaries.

Public API exports:

* :class:`~wireguard_tools.wireguard_config.WireguardConfig` —
  parse and generate ``wg(8)``-compatible configuration files.
* :class:`~wireguard_tools.wireguard_config.WireguardPeer` —
  represent a single peer section in a configuration.
* :class:`~wireguard_tools.wireguard_device.WireguardDevice` —
  interact with live WireGuard network interfaces.
* :class:`~wireguard_tools.wireguard_key.WireguardKey` —
  generate, derive, and serialise Curve25519 keys.
"""

from .wireguard_config import WireguardConfig, WireguardPeer
from .wireguard_device import WireguardDevice
from .wireguard_key import WireguardKey

__version__ = "0.7.0.dev0"
__all__ = [
    "WireguardConfig",
    "WireguardDevice",
    "WireguardKey",
    "WireguardPeer",
]
