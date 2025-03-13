# Copyright (c) 2022-2024 Carnegie Mellon University
# SPDX-License-Identifier: MIT

from __future__ import annotations

from binascii import hexlify, unhexlify
from secrets import token_bytes
from typing import ClassVar

import pytest

from wireguard_tools.curve25519 import (
    RAW_KEY_LENGTH,
    X25519PrivateKey,
    curve25519,
    curve25519_base,
)


class VectorTest:
    # assumes the derived class has an array named VECTORS consisting of
    # (scalar, input coordinate, output coordinate) tuples.
    VECTORS: ClassVar[list[tuple[bytes, bytes, bytes]]] = []

    def test_vectors(self) -> None:
        for scalar, input_ucoord, output_ucoord in self.VECTORS:
            scalar_bytes = unhexlify(scalar)
            ucoord_bytes = unhexlify(input_ucoord)
            output_bytes = curve25519(ucoord_bytes, scalar_bytes)
            assert hexlify(output_bytes) == output_ucoord


class TestPycurve25519(VectorTest):
    # https://github.com/TomCrypto/pycurve25519/blob/6cb15d7610c921956d7b33435fdf362ef7bf2ca4/test_curve25519.py
    VECTORS: ClassVar[list[tuple[bytes, bytes, bytes]]] = [
        (
            b"a8abababababababababababababababababababababababababababababab6b",
            b"0900000000000000000000000000000000000000000000000000000000000000",
            b"e3712d851a0e5d79b831c5e34ab22b41a198171de209b8b8faca23a11c624859",
        ),
        (
            b"c8cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd4d",
            b"0900000000000000000000000000000000000000000000000000000000000000",
            b"b5bea823d9c9ff576091c54b7c596c0ae296884f0e150290e88455d7fba6126f",
        ),
    ]

    def test_private_key_format(self) -> None:
        for _ in range(1024):
            data = token_bytes(RAW_KEY_LENGTH)
            private_bytes = X25519PrivateKey.from_private_bytes(data).private_bytes()

            # check if the key is properly formatted
            assert (private_bytes[0] & (~248)) == 0
            assert (private_bytes[31] & (~127)) == 0
            assert (private_bytes[31] & 64) != 0

    def test_shared_secret(self) -> None:
        pri1, _, pub1 = map(unhexlify, self.VECTORS[0])
        pri2, _, pub2 = map(unhexlify, self.VECTORS[1])

        shared1 = curve25519(pub2, pri1)
        shared2 = curve25519(pub1, pri2)

        assert shared1 == shared2
        assert (
            hexlify(shared1)
            == b"235101b705734aae8d4c2d9d0f1baf90bbb2a8c233d831a80d43815bb47ead10"
        )

    def test_shared_secret_extended(self) -> None:
        for _ in range(1024):
            pri1 = token_bytes(RAW_KEY_LENGTH)
            pri2 = token_bytes(RAW_KEY_LENGTH)
            pub1 = curve25519_base(pri1)
            pub2 = curve25519_base(pri2)
            shared1 = curve25519(pub2, pri1)
            shared2 = curve25519(pub1, pri2)
            assert shared1 == shared2


class TestRFC7748(VectorTest):
    # https://www.rfc-editor.org/rfc/rfc7748
    VECTORS: ClassVar[list[tuple[bytes, bytes, bytes]]] = [
        # RFC7748 6.1
        (
            b"77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a",
            b"0900000000000000000000000000000000000000000000000000000000000000",
            b"8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a",
        ),
        (
            b"5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb",
            b"0900000000000000000000000000000000000000000000000000000000000000",
            b"de9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f",
        ),
        # RFC7748 5.2
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"e6db6867583030db3594c1a424b15f7c726624ec26b3353b10a903a6d0ab1c4c",
            b"c3da55379de9c6908e94ea4df28d084f32eccf03491c71f754b4075577a28552",
        ),
        (
            b"4b66e9d4d1b4673c5ad22691957d6af5c11b6421e0ea01d42ca4169e7918ba0d",
            b"e5210f12786811d3f4b7959d0538ae2c31dbe7106fc03c3efc4cd549c715a493",
            b"95cbde9476e8907d7aade45cb4b873f88b595a68799fa152e6f8f7647aac7957",
        ),
        # this last one is special because it is used in an extended test
        (
            b"0900000000000000000000000000000000000000000000000000000000000000",
            b"0900000000000000000000000000000000000000000000000000000000000000",
            b"422c8e7a6227d7bca1350b3e2bb7279f7897b87bb6854b783c60e80311ae3079",
        ),
    ]

    def test_shared_secret(self) -> None:
        pri1, _, pub1 = map(unhexlify, self.VECTORS[0])
        pri2, _, pub2 = map(unhexlify, self.VECTORS[1])

        shared1 = curve25519(pub2, pri1)
        shared2 = curve25519(pub1, pri2)

        assert shared1 == shared2
        assert (
            hexlify(shared1)
            == b"4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742"
        )

    def test_rfc7748_extended(self) -> None:
        # keep iterating on the last one
        output_bytes, scalar_bytes, _ = map(unhexlify, self.VECTORS[-1])

        for _ in range(1000):
            ucoord_bytes, scalar_bytes = scalar_bytes, output_bytes
            output_bytes = curve25519(ucoord_bytes, scalar_bytes)
        assert (
            hexlify(output_bytes)
            == b"684cf59ba83309552800ef566f2f4d3c1c3887c49360e3875f2eb94d99532c51"
        )

    @pytest.mark.skip(reason="Skipping 2 1/2 hour long test")
    def test_rfc7748_extended_long(self) -> None:
        output_bytes, scalar_bytes, _ = map(unhexlify, self.VECTORS[-1])

        for _ in range(1000000):
            ucoord_bytes, scalar_bytes = scalar_bytes, output_bytes
            output_bytes = curve25519(ucoord_bytes, scalar_bytes)
        assert (
            hexlify(output_bytes)
            == b"7c3911e0ab2586fd864497297e575e6f3bc601c0883c30df5f4dd2d24f665424"
        )


class TestGcrypt(VectorTest):
    # https://github.com/gpg/libgcrypt/blob/ccfa9f2c1427b40483984198c3df41f8057f69f8/tests/t-cv25519.c#L514  # noqa: E501
    VECTORS: ClassVar[list[tuple[bytes, bytes, bytes]]] = [
        # Seven tests which result in 0.
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"0000000000000000000000000000000000000000000000000000000000000000",
            b"0000000000000000000000000000000000000000000000000000000000000000",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"0100000000000000000000000000000000000000000000000000000000000000",
            b"0000000000000000000000000000000000000000000000000000000000000000",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"e0eb7a7c3b41b8ae1656e3faf19fc46ada098deb9c32b1fd866205165f49b800",
            b"0000000000000000000000000000000000000000000000000000000000000000",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"5f9c95bca3508c24b1d0b1559c83ef5b04445cc4581c8e86d8224eddd09f1157",
            b"0000000000000000000000000000000000000000000000000000000000000000",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
            b"0000000000000000000000000000000000000000000000000000000000000000",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
            b"0000000000000000000000000000000000000000000000000000000000000000",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
            b"0000000000000000000000000000000000000000000000000000000000000000",
        ),
        # Five tests which result in 0 if decodeUCoordinate didn't change MSB.
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"cdeb7a7c3b41b8ae1656e3faf19fc46ada098deb9c32b1fd866205165f49b880",
            b"7ce548bc4919008436244d2da7a9906528fe3a6d278047654bd32d8acde9707b",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"4c9c95bca3508c24b1d0b1559c83ef5b04445cc4581c8e86d8224eddd09f11d7",
            b"e17902e989a034acdf7248260e2c94cdaf2fe1e72aaac7024a128058b6189939",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"d9ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            b"ea6e6ddf0685c31e152d5818441ac9ac8db1a01f3d6cb5041b07443a901e7145",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"daffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            b"845ddce7b3a9b3ee01a2f1fd4282ad293310f7a232cbc5459fb35d94bccc9d05",
        ),
        (
            b"a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4",
            b"dbffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            b"6989e2cb1cea159acf121b0af6bf77493189c9bd32c2dac71669b540f9488247",
        ),
    ]
