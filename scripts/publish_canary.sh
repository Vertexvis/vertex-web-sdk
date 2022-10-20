#!/bin/bash
#
# Internal script to publish canary versions to NPM.

set -e

. "$(pwd)"/scripts/utils.sh

preid="testing"
dist_tag="testing"
next_bump=`jq -r '.nextVersionBump' package.json`
version=`jq -r '.version' lerna.json`
next_version=`npx semver "$version" --increment "$next_bump"`
# published_canary_versions=`npm view @vertexvis/viewer --json versions | jq --arg version "$next_version-" -r '.[] | select(contains($version))'`

# echo $published_canary_versions

# if test -n "$published_canary_versions"
# then
#   published_version=`npx semver $(echo "$published_canary_versions") | tail -1`
#   echo "Detected published canary version $published_version"

#   next_canary_version=`npx semver "$published_version" --increment prerelease`
#   echo "Publishing canary version $next_canary_version"

#   # npx lerna version --no-push --no-git-tag-version --exact "$next_canary_version" --yes
#   # git commit -am "Canary release $next_canary_version"
#   # npx lerna publish from-package --canary --preid "$preid" --exact --dist-tag "$dist_tag" --yes
# else
  echo "No published canary version found for $next_version"

  next_canary_version="0.15.2-testing.1"
  echo "Publishing canary version $next_canary_version"

  npx lerna version --no-push --no-git-tag-version --exact "$next_canary_version" --yes
  git commit -am "Canary release $next_canary_version"
  npx lerna publish from-package --canary --preid "$preid" --exact --dist-tag "$dist_tag" --yes
# fi

