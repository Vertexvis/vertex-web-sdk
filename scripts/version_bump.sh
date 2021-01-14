#!/bin/bash
#
# Specifies if the next version will be a major, minor or patch release.

set -e

. "$(pwd)"/scripts/utils.sh

read -p "Specify the next version bump [major/minor/patch]: " bump_type

if [[ "$bump_type" == "major" ]] || [[ "$bump_type" == "minor" ]] || [[ "$bump_type" == "patch" ]];
then
  json=`jq --arg bump "$bump_type" '.nextVersionBump = $bump' package.json`
  echo "$json" > package.json
else
  echo "Bump must be either major, minor or patch."
  exit 1
fi
