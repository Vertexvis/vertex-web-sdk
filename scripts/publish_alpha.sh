#!/bin/bash
#
# Internal script to publish alpha versions to NPM.

set -e

. "$(pwd)"/scripts/utils.sh

preid="alpha"
dist_tag="alpha"
next_bump=`jq -r '.nextVersionBump' package.json`
version=`jq -r '.version' lerna.json`
next_version=`npx_ignore_scripts semver "$version" --increment "$next_bump"`
published_alpha_versions=`npm view @vertexvis/viewer --json versions | jq --arg prefix "$next_version-alpha." -r '.[] | select(startswith($prefix))'`

if [[ -n "$published_alpha_versions" ]]
then
  published_version=`npx_ignore_scripts semver $(echo "$published_alpha_versions") | tail -1`
  echo "Detected published alpha version $published_version"

  next_alpha_version=`npx_ignore_scripts semver "$published_version" --increment prerelease`
  echo "Publishing alpha version $next_alpha_version"

  npx_ignore_scripts lerna version --no-push --no-git-tag-version --exact "$next_alpha_version" --yes
  git commit -am "alpha release $next_alpha_version"
  npx_ignore_scripts lerna publish from-package --canary --preid "$preid" --exact --dist-tag "$dist_tag" --yes
else
  echo "No published alpha version found for $next_version"

  next_alpha_version=`npx_ignore_scripts semver "$version" --increment pre"$next_bump" --preid "$preid"`
  echo "Publishing alpha version $next_alpha_version"

  npx_ignore_scripts lerna version --no-push --no-git-tag-version --exact "$next_alpha_version" --yes
  git commit -am "alpha release $next_alpha_version"
  npx_ignore_scripts lerna publish from-package --canary --preid "$preid" --exact --dist-tag "$dist_tag" --yes
fi
