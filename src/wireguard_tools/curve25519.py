#
# https://gist.github.com/nickovs/cc3c22d15f239a2640c185035c06f8a3
#
# SPDX-FileCopyrightText: 2021 Nicko van Someren
# SPDX-License-Identifier: CC-PDDC
#
# There doesn't seem to be a 'Public Domain' license in the SPDX License list.
# I'm guessing the closest matching one would be 'CC-PDDC' where Nicko would be
# classified as the 'Dedicator'. https://spdx.org/licenses/CC-PDDC.html

"""A pure Python implementation of Curve25519.

This module supports both a low-level interface through curve25519(base_point, secret)
and curve25519_base(secret) that take 32-byte blocks of data as inputs and a higher
level interface using the X25519PrivateKey and X25519PublicKey classes that are
compatible with the classes in cryptography.hazmat.primitives.asymmetric.x25519 with
the same names.
"""
# trying to keep this somewhat close to the original gist
# pylint: disable=invalid-name,missing-class-docstring,missing-function-docstring

# By Nicko van Someren, 2021. This code is released into the public domain.

#                                  #### WARNING ####

# Since this code makes use of Python's built-in large integer types, it is NOT
# EXPECTED to run in constant time. While some effort is made to minimise the time
# variations, the underlying math functions are likely to have running times that are
# highly value-dependent, leaving this code potentially vulnerable to timing attacks.
# If this code is to be used to provide cryptographic security in an environment where
# the start and end times of the execution can be guessed, inferred or measured then it
# is critical that steps are taken to hide the execution time, for instance by adding a
# delay so that encrypted packets are not sent until a fixed time after the _start_ of
# execution.


# Implements ladder multiplication as described in "Montgomery curves and the Montgomery
# ladder" by Daniel J. Bernstein and Tanja Lange. https://eprint.iacr.org/2017/293.pdf

# Curve25519 is a Montgomery curve defined by:
# y**2 = x**3 + A * x**2 + x  mod P
# where P = 2**255-19 and A = 486662

from __future__ import annotations

from typing import Tuple

Point = Tuple[int, int]

P = 2**255 - 19
_A = 486662


def _point_add(point_n: Point, point_m: Point, point_diff: Point) -> Point:
    """Given the projection of two points and their difference, return their sum."""
    (xn, zn) = point_n
    (xm, zm) = point_m
    (x_diff, z_diff) = point_diff
    x = (z_diff << 2) * (xm * xn - zm * zn) ** 2
    z = (x_diff << 2) * (xm * zn - zm * xn) ** 2
    return x % P, z % P


def _point_double(point_n: Point) -> Point:
    """Double a point provided in projective coordinates."""
    (xn, zn) = point_n
    xn2 = xn**2
    zn2 = zn**2
    x = (xn2 - zn2) ** 2
    xzn = xn * zn
    z = 4 * xzn * (xn2 + _A * xzn + zn2)
    return x % P, z % P


def _const_time_swap(a: Point, b: Point, swap: bool) -> tuple[Point, Point]:
    """Swap two values in constant time."""
    index = int(swap) * 2
    temp = (a, b, b, a)
    return temp[index], temp[index + 1]


def _raw_curve25519(base: int, n: int) -> int:
    """Raise the point base to the power n."""
    zero = (1, 0)
    one = (base, 1)
    mP, m1P = zero, one

    for i in reversed(range(256)):
        bit = bool(n & (1 << i))
        mP, m1P = _const_time_swap(mP, m1P, bit)
        mP, m1P = _point_double(mP), _point_add(mP, m1P, one)
        mP, m1P = _const_time_swap(mP, m1P, bit)

    x, z = mP
    inv_z = pow(z, P - 2, P)
    return (x * inv_z) % P


def _unpack_number(s: bytes) -> int:
    """Unpack 32 bytes to a 256 bit value."""
    if len(s) != 32:
        msg = "Curve25519 values must be 32 bytes"
        raise ValueError(msg)
    return int.from_bytes(s, "little")


def _pack_number(n: int) -> bytes:
    """Pack a value into 32 bytes."""
    return n.to_bytes(32, "little")


def _fix_base_point(n: int) -> int:
    # RFC7748 section 5
    # u-coordinates are ... encoded as an array of bytes ... When receiving
    # such an array, implementations of X25519 MUST mask the most significant
    # bit in the final byte.
    n &= ~(128 << 8 * 31)
    return n


def _fix_secret(n: int) -> int:
    """Mask a value to be an acceptable exponent."""
    n &= ~7
    n &= ~(128 << 8 * 31)
    n |= 64 << 8 * 31
    return n


def curve25519(base_point_raw: bytes, secret_raw: bytes) -> bytes:
    """Raise the base point to a given power."""
    base_point = _fix_base_point(_unpack_number(base_point_raw))
    secret = _fix_secret(_unpack_number(secret_raw))
    return _pack_number(_raw_curve25519(base_point, secret))


def curve25519_base(secret_raw: bytes) -> bytes:
    """Raise the generator point to a given power."""
    secret = _fix_secret(_unpack_number(secret_raw))
    return _pack_number(_raw_curve25519(9, secret))


class X25519PublicKey:
    def __init__(self, x: int) -> None:
        self.x = x

    @classmethod
    def from_public_bytes(cls, data: bytes) -> X25519PublicKey:
        return cls(_fix_base_point(_unpack_number(data)))

    def public_bytes(self) -> bytes:
        return _pack_number(self.x)


class X25519PrivateKey:
    def __init__(self, a: int) -> None:
        self.a = a

    @classmethod
    def from_private_bytes(cls, data: bytes) -> X25519PrivateKey:
        return cls(_fix_secret(_unpack_number(data)))

    def private_bytes(self) -> bytes:
        return _pack_number(self.a)

    def public_key(self) -> bytes:
        return _pack_number(_raw_curve25519(9, self.a))

    def exchange(self, peer_public_key: X25519PublicKey | bytes) -> bytes:
        if isinstance(peer_public_key, bytes):
            peer_public_key = X25519PublicKey.from_public_bytes(peer_public_key)
        return _pack_number(_raw_curve25519(peer_public_key.x, self.a))
