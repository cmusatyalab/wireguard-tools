#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

from __future__ import annotations

import argparse
import os
import sys
from contextlib import closing
from secrets import token_bytes
from stat import S_IRWXO, S_ISREG
from typing import Iterable

from .wireguard_config import WireguardConfig
from .wireguard_device import WireguardDevice
from .wireguard_key import WireguardKey


def show(args: argparse.Namespace) -> int:
    """Show the current configuration and device information."""
    try:
        if args.interface is None:
            devices: Iterable[WireguardDevice] = WireguardDevice.list()
        else:
            devices = [WireguardDevice.get(args.interface)]

        for device in devices:
            print(f"interface: {device.interface}")
            print(device.get_config())
            device.close()
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1
    else:
        return 0


def showconf(args: argparse.Namespace) -> int:
    """Show the configuration of a WireGuard interface, for use with `setconf`."""
    try:
        with closing(WireguardDevice.get(args.interface)) as device:
            config = device.get_config()
            print(config.to_wgconfig(), end="")
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def set_(_args: argparse.Namespace) -> int:
    """Change the current configuration, add peers, remove peers, or change peers."""
    print("Not implemented yet")
    return 1


def setconf(args: argparse.Namespace) -> int:
    """Apply a configuration file to a WireGuard interface."""
    # XXX our device.set_config implicitly does a syncconf
    try:
        config = WireguardConfig.from_wgconfig(args.configfile)
        with closing(WireguardDevice.get(args.interface)) as device:
            device.set_config(config)
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def addconf(_args: argparse.Namespace) -> int:
    """Append a configuration file to a WireGuard interface."""
    print("Not implemented yet")
    return 1


def syncconf(args: argparse.Namespace) -> int:
    """Synchronize a configuration file with a WireGuard interface."""
    try:
        config = WireguardConfig.from_wgconfig(args.configfile)
        with closing(WireguardDevice.get(args.interface)) as device:
            device.set_config(config)
            return 0
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1


def _check_stdout() -> None:
    """Check and warn if stdout is a world accessible file."""
    stat = os.fstat(sys.stdout.fileno())
    if S_ISREG(stat.st_mode) and (stat.st_mode & S_IRWXO):
        print("Warning: writing to world accessible file.", file=sys.stderr)


def genkey(_args: argparse.Namespace) -> int:
    """Generate a new private key and write it to stdout."""
    _check_stdout()
    secret_key = WireguardKey.generate()
    print(secret_key)
    return 0


def genpsk(_args: argparse.Namespace) -> int:
    """Generate a new preshared key and write it to stdout."""
    _check_stdout()
    # generate a key without the curve25519 key value clamping
    random_data = token_bytes(32)
    preshared_key = WireguardKey(random_data)
    print(preshared_key)
    return 0


def pubkey(_args: argparse.Namespace) -> int:
    """Read a private key from stdin and write a public key to stdout."""
    private_key = sys.stdin.read()
    public_key = WireguardKey(private_key).public_key()
    print(public_key)
    return 0


def strip(args: argparse.Namespace) -> int:
    """Output a configuration file with all wg-quick specific options removed."""
    config = WireguardConfig.from_wgconfig(args.configfile)
    print(config.to_wgconfig())
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.set_defaults(func=lambda _: parser.print_help())

    sub = parser.add_subparsers(title="Available subcommands")
    show_parser = sub.add_parser("show", help=show.__doc__, description=show.__doc__)
    show_parser.add_argument("interface", nargs="?")
    show_parser.set_defaults(func=show)

    showconf_parser = sub.add_parser(
        "showconf",
        help=showconf.__doc__,
        description=showconf.__doc__,
    )
    showconf_parser.add_argument("interface")
    showconf_parser.set_defaults(func=showconf)

    set__parser = sub.add_parser("set", help=set_.__doc__, description=set_.__doc__)
    set__parser.set_defaults(func=set_)

    setconf_parser = sub.add_parser(
        "setconf",
        help=setconf.__doc__,
        description=setconf.__doc__,
    )
    setconf_parser.add_argument("interface")
    setconf_parser.add_argument("configfile", type=argparse.FileType("r"))
    setconf_parser.set_defaults(func=setconf)

    addconf_parser = sub.add_parser(
        "addconf",
        help=addconf.__doc__,
        description=addconf.__doc__,
    )
    addconf_parser.add_argument("interface")
    addconf_parser.add_argument("configfile", type=argparse.FileType("r"))
    addconf_parser.set_defaults(func=addconf)

    syncconf_parser = sub.add_parser(
        "syncconf",
        help=syncconf.__doc__,
        description=syncconf.__doc__,
    )
    syncconf_parser.add_argument("interface")
    syncconf_parser.add_argument("configfile", type=argparse.FileType("r"))
    syncconf_parser.set_defaults(func=syncconf)

    genkey_parser = sub.add_parser(
        "genkey",
        help=genkey.__doc__,
        description=genkey.__doc__,
    )
    genkey_parser.set_defaults(func=genkey)

    genpsk_parser = sub.add_parser(
        "genpsk",
        help=genpsk.__doc__,
        description=genpsk.__doc__,
    )
    genpsk_parser.set_defaults(func=genpsk)

    pubkey_parser = sub.add_parser(
        "pubkey",
        help=pubkey.__doc__,
        description=pubkey.__doc__,
    )
    pubkey_parser.set_defaults(func=pubkey)

    # from wg-quick
    strip_parser = sub.add_parser(
        "strip",
        help=strip.__doc__,
        description=strip.__doc__,
    )
    strip_parser.add_argument("configfile", type=argparse.FileType("r"))
    strip_parser.set_defaults(func=strip)

    args = parser.parse_args()
    result: int = args.func(args)
    return result


if __name__ == "__main__":
    sys.exit(main())
