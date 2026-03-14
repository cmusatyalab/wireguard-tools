#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

"""Abstract base class for WireGuard device backends.

This module defines :class:`WireguardDevice`, the backend-agnostic
interface for reading and writing WireGuard interface configurations.
Concrete implementations are provided by
:mod:`wireguard_tools.wireguard_netlink` (Linux Netlink via pyroute2) and
:mod:`wireguard_tools.wireguard_uapi` (userspace UAPI socket).

The :meth:`WireguardDevice.get` and :meth:`WireguardDevice.list` class
methods automatically select an appropriate backend at runtime, preferring
the UAPI socket when available and falling back to Netlink.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import suppress
from typing import TYPE_CHECKING, Iterator

if TYPE_CHECKING:
    from .wireguard_config import WireguardConfig


class WireguardDevice(ABC):
    """Abstract base for WireGuard device management.

    Subclasses must implement :meth:`get_config` and :meth:`set_config`.
    :meth:`sync_config` has a default implementation that delegates to
    :meth:`set_config` but may be overridden for backends that support
    incremental updates.

    Use the :meth:`get` class method to obtain a backend-appropriate
    device handle for a given interface name, or :meth:`list` to discover
    all WireGuard interfaces on the system.

    :param interface: Operating-system name of the WireGuard network
        interface (e.g. ``"wg0"``).
    """

    def __init__(self, interface: str) -> None:
        self.interface = interface

    def close(self) -> None:
        """Release resources held by this device handle.

        The default implementation is a no-op.  Subclasses that open file
        descriptors or sockets should override this method.
        """
        return None

    @abstractmethod
    def get_config(self) -> WireguardConfig:
        """Retrieve the current running configuration of the interface.

        :returns: Snapshot of the active interface configuration and peer
            state.
        :rtype: WireguardConfig
        """
        ...

    @abstractmethod
    def set_config(self, config: WireguardConfig) -> None:
        """Atomically replace the full interface configuration (setconf).

        All existing peers are removed and replaced with those defined in
        *config*.  Interface-level parameters (private key, listen port,
        fwmark) are set unconditionally.

        :param config: The desired complete interface configuration.
        """
        ...

    def sync_config(self, config: WireguardConfig) -> None:
        """Diff against running config and apply only changes (syncconf).

        Unlike :meth:`set_config`, this method preserves peers that are
        unchanged and only adds, removes, or updates those that differ.
        Subclasses may override with an optimised implementation; the
        default simply delegates to :meth:`set_config`.

        :param config: The desired complete interface configuration.
        """
        self.set_config(config)

    @classmethod
    def get(cls, ifname: str) -> WireguardDevice:
        """Obtain a device handle for the named interface.

        Backend selection tries the UAPI userspace socket first
        (:class:`~wireguard_tools.wireguard_uapi.WireguardUAPIDevice`) and
        falls back to the Netlink backend
        (:class:`~wireguard_tools.wireguard_netlink.WireguardNetlinkDevice`)
        if the UAPI socket file is not found.

        :param ifname: Interface name (e.g. ``"wg0"``).
        :returns: A concrete device handle for the interface.
        :rtype: WireguardDevice
        """
        from .wireguard_netlink import WireguardNetlinkDevice
        from .wireguard_uapi import WireguardUAPIDevice

        with suppress(FileNotFoundError):
            return WireguardUAPIDevice(ifname)
        return WireguardNetlinkDevice(ifname)

    @classmethod
    def list(cls) -> Iterator[WireguardDevice]:
        """Discover all WireGuard interfaces on the system.

        Yields devices from both the Netlink and UAPI backends.  Netlink
        devices are yielded first, followed by UAPI devices.

        :returns: Iterator of device handles.
        :rtype: Iterator[WireguardDevice]
        """
        from .wireguard_netlink import WireguardNetlinkDevice
        from .wireguard_uapi import WireguardUAPIDevice

        yield from WireguardNetlinkDevice.list()
        yield from WireguardUAPIDevice.list()
