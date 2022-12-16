#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

from .wireguard_config import WireguardConfig


class WireguardDevice(ABC):
    def __init__(self, interface: str) -> None:
        self.interface = interface

    @abstractmethod
    def close(self) -> None:
        pass

    @abstractmethod
    def get_config(self) -> WireguardConfig:
        ...

    @abstractmethod
    def set_config(self, config: WireguardConfig) -> None:
        ...

    @classmethod
    def get(cls, ifname: str) -> WireguardDevice | None:
        from .wireguard_netlink import WireguardNetlinkDevice
        from .wireguard_uapi import WireguardUAPIDevice

        device = WireguardUAPIDevice.get(ifname)
        if device is None:
            device = WireguardNetlinkDevice.get(ifname)
        return device

    @classmethod
    def list(cls) -> Iterable[WireguardDevice]:
        from .wireguard_netlink import WireguardNetlinkDevice
        from .wireguard_uapi import WireguardUAPIDevice

        yield from WireguardNetlinkDevice.list()
        yield from WireguardUAPIDevice.list()
