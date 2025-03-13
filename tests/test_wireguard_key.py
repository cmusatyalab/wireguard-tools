# Copyright (c) 2022 Carnegie Mellon University
# SPDX-License-Identifier: MIT

import pytest

from wireguard_tools.wireguard_key import WireguardKey


def urlsafe_encoding(key: str) -> str:
    return key.translate(str.maketrans("/+", "_-")).rstrip("=")


class TestWireguardKey:
    def test_create(self, example_wgkey: str) -> None:
        stored_key = WireguardKey(example_wgkey)
        assert str(stored_key) == example_wgkey
        assert stored_key.urlsafe == urlsafe_encoding(example_wgkey)

        key_copy = WireguardKey(stored_key)
        assert stored_key == key_copy

        with pytest.raises(ValueError, match="Invalid WireGuard key length"):
            WireguardKey("foobar")
