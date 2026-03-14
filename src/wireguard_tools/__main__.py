#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#
"""Entry point for ``python -m wireguard_tools``.

Invoking this module as a script delegates to the CLI defined in
:func:`wireguard_tools.cli.main` and exits with its return code.
"""

import sys

from .cli import main

sys.exit(main())
