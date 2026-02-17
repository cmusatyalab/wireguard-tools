# SPDX-FileCopyrightText: 2023 Carnegie Mellon University
# SPDX-License-Identifier: 0BSD

# Test wireguard-tools wheel against different python versions
#
#   pipx install nox
#   pipx inject nox nox-uv
#   nox

from nox import options
from nox_uv import session

options.default_venv_backend = "uv"


@session(
    python=["3.13", "3.12", "3.11", "3.10", "3.9", "3.8"],
    uv_groups=["test"],
)
def tests(session):
    session.run("python", "-m", "pytest")
