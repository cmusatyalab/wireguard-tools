#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import suppress
from typing import TYPE_CHECKING, Iterator

if TYPE_CHECKING:
    from .wireguard_config import WireguardConfig


class WireguardDevice(ABC):
    def __init__(self, interface: str) -> None:
        self.interface = interface

    def close(self) -> None:
        return None

    @abstractmethod
    def get_config(self) -> WireguardConfig: ...

    @abstractmethod
    def set_config(self, config: WireguardConfig) -> None: ...

    @classmethod
    def get(cls, ifname: str) -> WireguardDevice:
        from .wireguard_netlink import WireguardNetlinkDevice
        from .wireguard_uapi import WireguardUAPIDevice

        with suppress(FileNotFoundError):
            return WireguardUAPIDevice(ifname)
        return WireguardNetlinkDevice(ifname)

    @classmethod
    def list(cls) -> Iterator[WireguardDevice]:
        from .wireguard_netlink import WireguardNetlinkDevice
        from .wireguard_uapi import WireguardUAPIDevice

        yield from WireguardNetlinkDevice.list()
        yield from WireguardUAPIDevice.list()
