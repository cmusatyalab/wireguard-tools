# SPDX-FileCopyrightText: 2023 Carnegie Mellon University
# SPDX-License-Identifier: 0BSD

# Test wireguard-tools wheel against different python versions
#
#   pipx install nox
#   pipx inject nox nox-poetry
#   nox

from nox_poetry import session


@session(python=["3.11", "3.10", "3.9", "3.8", "3.7"])
def tests(session):
    session.install("pytest", ".")
    session.run("pytest")
