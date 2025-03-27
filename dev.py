#!/usr/bin/env python3
"""
A tool to support the maintenance of templates in this repository.
Something like a Makefile but written in Python for easier maintenance.

To list the available commands, run ./dev.py --help.
"""
import argparse
import glob
import tempfile
import typing
import shlex
import subprocess
from pathlib import Path
import json
import sys
import shutil
import os

THIS_DIRECTORY = Path(__file__).parent.absolute()
TEMPLATE_DIRECTORIES = [ THIS_DIRECTORY ]


# Utilities function
def run_verbose(cmd_args, *args, **kwargs):
    kwargs.setdefault("check", True)
    cwd = kwargs.get('cwd')
    message_suffix = f" [CWD: {Path(cwd).relative_to(THIS_DIRECTORY)}]" if cwd else ''

    print(f"$ {shlex.join(cmd_args)}{message_suffix}", flush=True)
    subprocess.run(cmd_args, *args, **kwargs)


# Commands
def cmd_all_npm_install(args):
    """Install all node dependencies for all examples"""
    for project_dir in TEMPLATE_DIRECTORIES:
        frontend_dir = next(project_dir.glob("*/frontend/"))
        run_verbose(["npm", "install"], cwd=str(frontend_dir))


def cmd_all_npm_build(args):
    """Build javascript code for all examples and templates"""
    for project_dir in TEMPLATE_DIRECTORIES:
        frontend_dir = next(project_dir.glob("*/frontend/"))
        run_verbose(["npm", "run", "build"], cwd=str(frontend_dir))


def cmd_all_python_build_package(args):
    """Build wheel packages for all examples and templates"""
    run_verbose(["uv", "build"])


def check_deps(template_package_json, current_package_json):
    return (
            check_deps_section(template_package_json, current_package_json, 'dependencies') +
            check_deps_section(template_package_json, current_package_json, 'devDependencies')
    )


def check_deps_section(template_package_json, current_package_json, section_name):
    current_package_deps = current_package_json.get(section_name, dict())
    template_package_deps = template_package_json.get(section_name, dict())
    errors = []

    for k, v in template_package_deps.items():
        if k not in current_package_deps:
            errors.append(f'Missing [{k}:{v}] in {section_name!r} section')
            continue
        current_version = current_package_deps[k]
        if current_version != v:
            errors.append(f'Invalid version of {k!r}. Expected: {v!r}. Current: {current_version!r}')
    return errors



ARG_STREAMLIT_VERSION = ("--streamlit-version", "latest", "Streamlit version for which tests will be run.")
ARG_STREAMLIT_WHEEL_FILE = ("--streamlit-wheel-file", "", "")
ARG_PYTHON_VERSION = ("--python-version", os.environ.get("PYTHON_VERSION", "3.11.4"), "Python version for which tests will be run.")

COMMANDS = {
    "all-npm-install": {
        "fn": cmd_all_npm_install
    },
    "all-npm-build": {
        "fn": cmd_all_npm_build
    },
    "all-python-build-package": {
        "fn": cmd_all_python_build_package
    },
}


# Parser
def get_parser():
    parser = argparse.ArgumentParser(prog=__file__, description=__doc__)
    subparsers = parser.add_subparsers(dest="subcommand", metavar="COMMAND")
    subparsers.required = True
    for command_name, command_info in COMMANDS.items():
        command_fn = command_info['fn']
        subparser = subparsers.add_parser(command_name, help=command_fn.__doc__)

        for arg_name, arg_default, arg_help in command_info.get('arguments', []):
            subparser.add_argument(arg_name, default=arg_default, help=arg_help)

        subparser.set_defaults(func=command_fn)

    return parser


# Main function
def main():
    parser = get_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
