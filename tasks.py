# SPDX-FileCopyrightText: 2022 Carnegie Mellon University
# SPDX-License-Identifier: 0BSD

# pyinvoke file for maintenance tasks

import re

from invoke import task


@task
def update_dependencies(c):
    """Update python package dependencies"""
    # update project + pre-commit check dependencies
    c.run("poetry update")
    c.run("poetry run pre-commit autoupdate")
    # make sure project still passes pre-commit and unittests
    c.run("poetry run pre-commit run -a")
    c.run("poetry run pytest")
    # commit updates
    c.run("git commit -m 'Update dependencies' poetry.lock .pre-commit-config.yaml")


def get_current_version(c):
    """Get the current application version.
    Helm chart version should always be >= application version.
    """
    r = c.run("poetry run tbump current-version", hide="out")
    return r.stdout.strip()


def bump_current_version(c, part):
    """Simplistic version bumping."""
    current_version = get_current_version(c)
    match = re.match(r"(\d+)\.(\d+)\.(\d+)", current_version)
    assert match is not None

    major, minor, patch = match.groups()
    if part == "major":
        return f"{int(major)+1}.0.0"
    if part == "minor":
        return f"{major}.{int(minor)+1}.0"
    return f"{major}.{minor}.{int(patch)+1}"


@task
def publish_release(c, part="patch"):
    """Bump application version, build, tag, publish and bump to dev tag"""
    # bump source version for next release
    release = bump_current_version(c, part)
    c.run(f"poetry run tbump --no-tag --no-push {release}")

    # build and tag source
    c.run("poetry build")
    c.run(f"git tag -m v{release} v{release}")

    # publish
    c.run("poetry publish")

    # bump source version to new development tag
    new_version = get_current_version(c) + ".post.dev0"
    c.run(f"poetry run tbump --non-interactive --only-patch {new_version}")
    c.run("git add --update")
    c.run(f'git commit --no-verify --message "Bumping to {new_version}"')

    # update source and tags in github
    c.run("git push")
    c.run("git push --tags")
