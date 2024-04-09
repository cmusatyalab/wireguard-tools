# Copyright (c) 2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT

from wireguard_tools.cli import main as _cli_main  # noqa: F401


def test_entrypoints() -> None:
    """The real test was if we could import the entrypoints"""
    assert True
