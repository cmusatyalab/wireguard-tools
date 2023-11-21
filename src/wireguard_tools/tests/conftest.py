# Copyright (c) 2022 Carnegie Mellon University
# SPDX-License-Identifier: MIT

import pytest


@pytest.fixture(scope="session")
def example_wgkey() -> str:
    return "YpdTsMtb/QCdYKzHlzKkLcLzEbdTK0vP4ILmdcIvnhc="
