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

RAW_KEY_LENGTH = 32
P = 2**255 - 19
_A = 486662


def _point_add(point_n: Point, point_m: Point, point_diff: Point) -> Point:
    """Compute the sum of two points given their difference (Montgomery ladder).

    Perform differential addition on the Montgomery curve using projective
    coordinates.  All arithmetic is reduced modulo :data:`P`.

    :param point_n: First point as *(x, z)* in projective coordinates.
    :type point_n: Point
    :param point_m: Second point as *(x, z)* in projective coordinates.
    :type point_m: Point
    :param point_diff: The known difference *point_n − point_m* in
        projective coordinates.
    :type point_diff: Point
    :returns: The sum *point_n + point_m* in projective coordinates.
    :rtype: Point
    """
    xn, zn = point_n
    xm, zm = point_m
    x_diff, z_diff = point_diff
    x = (z_diff << 2) * (xm * xn - zm * zn) ** 2
    z = (x_diff << 2) * (xm * zn - zm * xn) ** 2
    return x % P, z % P


def _point_double(point_n: Point) -> Point:
    """Double a point on the Montgomery curve in projective coordinates.

    All arithmetic is reduced modulo :data:`P`.

    :param point_n: The point to double as *(x, z)*.
    :type point_n: Point
    :returns: The doubled point *2 · point_n* as *(x, z)*.
    :rtype: Point
    """
    xn, zn = point_n
    xn2 = xn**2
    zn2 = zn**2
    x = (xn2 - zn2) ** 2
    xzn = xn * zn
    z = 4 * xzn * (xn2 + _A * xzn + zn2)
    return x % P, z % P


def _const_time_swap(a: Point, b: Point, *, swap: bool) -> tuple[Point, Point]:
    """Conditionally swap two points in (approximately) constant time.

    Uses tuple indexing rather than a branch to reduce timing
    side-channels, though Python's big-integer arithmetic elsewhere in
    this module is **not** constant-time — see the module-level warning.

    :param a: First point.
    :type a: Point
    :param b: Second point.
    :type b: Point
    :param swap: If ``True``, return ``(b, a)``; otherwise ``(a, b)``.
    :type swap: bool
    :returns: The (possibly swapped) pair.
    :rtype: tuple[Point, Point]
    """
    index = int(swap) * 2
    temp = (a, b, b, a)
    return temp[index], temp[index + 1]


def _raw_curve25519(base: int, n: int) -> int:
    """Perform a Montgomery-ladder scalar multiplication on Curve25519.

    Compute *n · P* where *P* is the point whose *u*-coordinate is
    *base*, iterating from the most-significant bit downward.

    :param base: The *u*-coordinate of the base point (integer mod *P*).
    :type base: int
    :param n: The scalar (already clamped).
    :type n: int
    :returns: The *u*-coordinate of the resulting point.
    :rtype: int
    """
    zero = (1, 0)
    one = (base, 1)
    mP, m1P = zero, one

    for i in reversed(range(256)):
        bit = bool(n & (1 << i))
        mP, m1P = _const_time_swap(mP, m1P, swap=bit)
        mP, m1P = _point_double(mP), _point_add(mP, m1P, one)
        mP, m1P = _const_time_swap(mP, m1P, swap=bit)

    x, z = mP
    inv_z = pow(z, P - 2, P)
    return (x * inv_z) % P


def _unpack_number(s: bytes) -> int:
    """Unpack a 32-byte little-endian byte string into a 256-bit integer.

    :param s: Exactly 32 bytes of data.
    :type s: bytes
    :returns: The decoded unsigned integer.
    :rtype: int
    :raises ValueError: If *s* is not exactly 32 bytes long.
    """
    if len(s) != RAW_KEY_LENGTH:
        msg = "Curve25519 values must be 32 bytes"
        raise ValueError(msg)
    return int.from_bytes(s, "little")


def _pack_number(n: int) -> bytes:
    """Pack a 256-bit integer into a 32-byte little-endian byte string.

    :param n: The integer to encode (must fit in 32 bytes).
    :type n: int
    :returns: A 32-byte ``bytes`` object.
    :rtype: bytes
    """
    return n.to_bytes(RAW_KEY_LENGTH, "little")


def _fix_base_point(n: int) -> int:
    """Mask a base-point *u*-coordinate per :rfc:`7748` §5.

    Clear the most-significant bit of the final byte so that the
    *u*-coordinate is reduced to 255 bits as required by the protocol.

    :param n: Raw decoded integer from a 32-byte public key.
    :type n: int
    :returns: The masked *u*-coordinate.
    :rtype: int
    """
    # RFC7748 section 5
    # u-coordinates are ... encoded as an array of bytes ... When receiving
    # such an array, implementations of X25519 MUST mask the most significant
    # bit in the final byte.
    n &= ~(128 << 8 * 31)
    return n


def _fix_secret(n: int) -> int:
    """Clamp a raw integer into a valid Curve25519 private scalar.

    Apply the three clamping operations defined in :rfc:`7748` §5:

    1. Clear the three lowest bits (ensures the scalar is a multiple of 8).
    2. Clear bit 255 (the most-significant bit of the final byte).
    3. Set bit 254 (ensures a fixed position for the high bit).

    :param n: The raw 256-bit integer to clamp.
    :type n: int
    :returns: The clamped scalar.
    :rtype: int
    """
    n &= ~7
    n &= ~(128 << 8 * 31)
    n |= 64 << 8 * 31
    return n


def curve25519(base_point_raw: bytes, secret_raw: bytes) -> bytes:
    """Perform an X25519 Diffie-Hellman function on raw byte inputs.

    Decode and clamp both the base point and the secret, execute the
    Montgomery-ladder scalar multiplication, and return the result as a
    32-byte little-endian byte string.

    :param base_point_raw: 32-byte encoding of the peer's public
        *u*-coordinate.
    :type base_point_raw: bytes
    :param secret_raw: 32-byte encoding of the local private scalar.
    :type secret_raw: bytes
    :returns: The 32-byte shared secret.
    :rtype: bytes
    :raises ValueError: If either input is not exactly 32 bytes.
    """
    base_point = _fix_base_point(_unpack_number(base_point_raw))
    secret = _fix_secret(_unpack_number(secret_raw))
    return _pack_number(_raw_curve25519(base_point, secret))


def curve25519_base(secret_raw: bytes) -> bytes:
    """Derive a Curve25519 public key from a raw private scalar.

    Equivalent to ``curve25519(generator, secret_raw)`` where the
    generator has *u*-coordinate 9.

    :param secret_raw: 32-byte encoding of the private scalar.
    :type secret_raw: bytes
    :returns: The 32-byte public key.
    :rtype: bytes
    :raises ValueError: If *secret_raw* is not exactly 32 bytes.
    """
    secret = _fix_secret(_unpack_number(secret_raw))
    return _pack_number(_raw_curve25519(9, secret))


class X25519PublicKey:
    """An X25519 public key (a point on Curve25519).

    This class provides an API compatible with
    :class:`cryptography.hazmat.primitives.asymmetric.x25519.X25519PublicKey`
    so it can be used as a drop-in pure-Python replacement.

    :param x: The *u*-coordinate of the public point (already masked).
    :type x: int
    """

    def __init__(self, x: int) -> None:
        """Initialise with a pre-masked *u*-coordinate integer.

        Callers should normally use :meth:`from_public_bytes` instead of
        invoking the constructor directly.

        :param x: Masked *u*-coordinate.
        :type x: int
        """
        self.x = x

    @classmethod
    def from_public_bytes(cls, data: bytes) -> X25519PublicKey:
        """Construct a public key from its 32-byte encoding.

        The most-significant bit of the final byte is cleared per
        :rfc:`7748` §5 before storing.

        :param data: 32-byte raw public key.
        :type data: bytes
        :returns: The decoded public key.
        :rtype: X25519PublicKey
        :raises ValueError: If *data* is not exactly 32 bytes.
        """
        return cls(_fix_base_point(_unpack_number(data)))

    def public_bytes(self) -> bytes:
        """Serialise the public key to a 32-byte little-endian byte string.

        :returns: The encoded public key.
        :rtype: bytes
        """
        return _pack_number(self.x)


class X25519PrivateKey:
    """An X25519 private key (a clamped Curve25519 scalar).

    This class provides an API compatible with
    :class:`cryptography.hazmat.primitives.asymmetric.x25519.X25519PrivateKey`
    so it can be used as a drop-in pure-Python replacement.

    .. warning::

       The underlying arithmetic uses Python's arbitrary-precision
       integers and is **not** constant-time.  See the module-level
       timing warning before using this in security-sensitive contexts.

    :param a: The clamped private scalar.
    :type a: int
    """

    def __init__(self, a: int) -> None:
        """Initialise with an already-clamped scalar.

        Callers should normally use :meth:`from_private_bytes` which
        applies the clamping automatically.

        :param a: Clamped private scalar.
        :type a: int
        """
        self.a = a

    @classmethod
    def from_private_bytes(cls, data: bytes) -> X25519PrivateKey:
        """Construct a private key from its 32-byte encoding.

        The raw bytes are decoded as a little-endian integer and then
        clamped via :func:`_fix_secret` to produce a valid Curve25519
        scalar.

        :param data: 32-byte raw private key material.
        :type data: bytes
        :returns: The decoded and clamped private key.
        :rtype: X25519PrivateKey
        :raises ValueError: If *data* is not exactly 32 bytes.
        """
        return cls(_fix_secret(_unpack_number(data)))

    def private_bytes(self) -> bytes:
        """Serialise the private scalar to a 32-byte little-endian byte string.

        :returns: The encoded private key.
        :rtype: bytes
        """
        return _pack_number(self.a)

    def public_key(self) -> bytes:
        """Derive the corresponding public key.

        Multiply the Curve25519 base point (*u* = 9) by the private
        scalar and return the result as a 32-byte encoding.

        :returns: The 32-byte public key.
        :rtype: bytes
        """
        return _pack_number(_raw_curve25519(9, self.a))

    def exchange(self, peer_public_key: X25519PublicKey | bytes) -> bytes:
        """Perform an X25519 Diffie-Hellman key exchange.

        Multiply *peer_public_key* by the private scalar and return the
        shared secret.  If *peer_public_key* is raw ``bytes`` it is
        first decoded via :meth:`X25519PublicKey.from_public_bytes`.

        :param peer_public_key: The peer's public key.
        :type peer_public_key: X25519PublicKey | bytes
        :returns: The 32-byte shared secret.
        :rtype: bytes
        """
        if isinstance(peer_public_key, bytes):
            peer_public_key = X25519PublicKey.from_public_bytes(peer_public_key)
        return _pack_number(_raw_curve25519(peer_public_key.x, self.a))
