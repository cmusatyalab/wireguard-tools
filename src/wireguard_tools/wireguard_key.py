#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#
"""A class to represent WireGuard keys.

The constructor will parse from various base64 and hex encodings. There are
also class methods to generate new private keys and derive public keys.
"""

from __future__ import annotations

from base64 import standard_b64encode, urlsafe_b64decode, urlsafe_b64encode
from secrets import token_bytes

from attrs import define, field

from .curve25519 import RAW_KEY_LENGTH, X25519PrivateKey

# Length of a wireguard key when encoded as a hexadecimal string
HEX_KEY_LENGTH = 64


def convert_wireguard_key(value: str | bytes | WireguardKey) -> bytes:
    """Decode a WireGuard key from various representations into raw bytes.

    Accept a key in one of several common formats and normalise it to a
    32-byte ``bytes`` object suitable for cryptographic operations.

    The following input types are handled:

    * :class:`WireguardKey` — the existing ``keydata`` is returned directly.
    * ``bytes`` — assumed to be the raw 32-byte key material.
    * ``str`` of length 64 — decoded as a hexadecimal string.
    * Any other ``str`` — decoded as URL-safe Base64 (missing ``=`` padding
      is tolerated).

    :param value: Key material in any of the accepted formats.
    :type value: str | bytes | WireguardKey
    :returns: The raw 32-byte key.
    :rtype: bytes
    :raises ValueError: If the decoded key is not exactly 32 bytes long.
    """
    if isinstance(value, WireguardKey):
        return value.keydata

    if isinstance(value, bytes):
        raw_key = value
    elif len(value) == HEX_KEY_LENGTH:
        raw_key = bytes.fromhex(value)
    else:
        raw_key = urlsafe_b64decode(value + "==")

    if len(raw_key) != RAW_KEY_LENGTH:
        msg = "Invalid WireGuard key length"
        raise ValueError(msg)

    return raw_key


@define(frozen=True)
class WireguardKey:
    """Immutable representation of a WireGuard Curve25519 key.

    This is an *attrs*-based frozen class that wraps 32 bytes of key
    material.  Instances can be created from raw ``bytes``, hexadecimal
    strings, Base64-encoded strings, or existing :class:`WireguardKey`
    objects — the :func:`convert_wireguard_key` converter is applied
    automatically by the constructor.

    Being frozen, :class:`WireguardKey` is hashable and can be used as a
    dictionary key or in sets.

    :param keydata: Key material in any format accepted by
        :func:`convert_wireguard_key`.
    :type keydata: str | bytes | WireguardKey
    """

    keydata: bytes = field(converter=convert_wireguard_key)

    @classmethod
    def generate(cls) -> WireguardKey:
        """Generate a new random Curve25519 private key.

        Obtain 32 cryptographically-secure random bytes via
        :func:`secrets.token_bytes` and clamp them into a valid
        Curve25519 private scalar using
        :meth:`X25519PrivateKey.from_private_bytes`.

        :returns: A freshly generated private key.
        :rtype: WireguardKey
        """
        random_data = token_bytes(RAW_KEY_LENGTH)
        # turn it into a proper curve25519 private key by fixing/clamping the value
        private_bytes = X25519PrivateKey.from_private_bytes(random_data).private_bytes()
        return cls(private_bytes)

    def public_key(self) -> WireguardKey:
        """Derive the Curve25519 public key from this private key.

        Perform a scalar multiplication of the Curve25519 base point by
        the private scalar stored in this key.

        :returns: The corresponding public key.
        :rtype: WireguardKey
        """
        public_bytes = X25519PrivateKey.from_private_bytes(self.keydata).public_key()
        return WireguardKey(public_bytes)

    def __bool__(self) -> bool:
        """Return whether the key contains non-zero data.

        An all-zero key is treated as *falsy*, which is useful for
        detecting unset or placeholder keys.

        :returns: ``False`` if every byte is zero, ``True`` otherwise.
        :rtype: bool
        """
        return int.from_bytes(self.keydata, "little") != 0

    def __repr__(self) -> str:
        """Return an unambiguous string that can recreate this key.

        The format is ``WireguardKey('<base64>')`` so that it is both
        human-readable and usable in ``eval()`` round-trips.

        :returns: Evaluable representation of the key.
        :rtype: str
        """
        return f"WireguardKey('{self}')"

    def __str__(self) -> str:
        """Return the standard (non-URL-safe) Base64 encoding of the key.

        This is the canonical encoding used by ``wg(8)`` and WireGuard
        configuration files.

        :returns: Base64-encoded key string (44 characters, ``=`` padded).
        :rtype: str
        """
        return standard_b64encode(self.keydata).decode("utf-8")

    @property
    def urlsafe(self) -> str:
        """Return the URL-safe Base64 encoding of the key without padding.

        Uses ``+`` → ``-`` and ``/`` → ``_`` substitutions per
        :rfc:`4648` §5 and strips trailing ``=`` padding characters.

        :returns: URL-safe Base64 key string with no ``=`` padding.
        :rtype: str
        """
        return urlsafe_b64encode(self.keydata).decode("utf-8").rstrip("=")

    @property
    def hex(self) -> str:
        """Return the lowercase hexadecimal encoding of the key.

        The result is a 64-character string containing only ``[0-9a-f]``.

        :returns: Hex-encoded key string.
        :rtype: str
        """
        return self.keydata.hex()
