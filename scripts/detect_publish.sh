#!/bin/sh

. "$(pwd)"/scripts/utils.sh

# Internal script used by CI to detect if we need to publish packages to NPM.

set -e

version=v$(get_version)

git fetch --tags

if test -z `git tag --list $version`
then
  echo 1
else
  echo 0
fi
