#!/bin/bash
#
# Internal script to publish testing versions to NPM.

set -e

. "$(pwd)"/scripts/utils.sh

preid="testing"
dist_tag="testing"
next_bump=`jq -r '.nextVersionBump' package.json`
version=`jq -r '.version' lerna.json`
next_version=`npx semver "$version" --increment "$next_bump"`
published_testing_versions=`npm view @vertexvis/viewer --json versions | jq --arg version "$next_version-" -r '.[] | select(contains($version) and contains("testing"))'`

if test -n "$published_testing_versions"
then
  published_version=`npx semver $(echo "$published_testing_versions") | tail -1`
  echo "Detected published testing version $published_version"

  next_testing_version=`npx semver "$published_version" --increment prerelease`
  echo "Publishing testing version $next_testing_version"

  npx lerna version --no-push --no-git-tag-version --exact "$next_testing_version" --yes
  git commit -am "testing release $next_testing_version"
  npx lerna publish from-package --canary --preid "$preid" --exact --dist-tag "$dist_tag" --yes
else
  echo "No published testing version found for $next_version"

  next_testing_version=`npx semver "$version" --increment pre"$next_bump" --preid "$preid"`
  echo "Publishing testing version $next_testing_version"

  npx lerna version --no-push --no-git-tag-version --exact "$next_testing_version" --yes
  git commit -am "testing release $next_testing_version"
  npx lerna publish from-package --canary --preid "$preid" --exact --dist-tag "$dist_tag" --yes
fi

