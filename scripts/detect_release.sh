#!/bin/sh

# Internal script used by CI to detect if we need to publish packages to NPM.

set -e

sha=$(git rev-parse HEAD)
version=v`jq -r '.version' ./lerna.json`

git fetch --tags

if test -z `git tag --list $version`
then
  echo 1
else
  echo 0
fi
