#
# Pure Python reimplementation of wireguard-tools
#
# Copyright (c) 2022 Carnegie Mellon University
# SPDX-License-Identifier: MIT
#

import sys

from .cli import main

sys.exit(main())
