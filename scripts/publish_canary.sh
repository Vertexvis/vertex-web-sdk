#!/bin/bash

# Internal script to publish packages to NPM.

set -e

. "$(pwd)"/scripts/utils.sh

next_bump=`jq -r '.nextVersionBump' package.json`

npx lerna publish from-package --canary --preid next --dist-tag next --yes "$next_bump"

version="v$(npm view @vertexvis/viewer dist-tags.next)"
sha="$(git rev-parse HEAD)"

curl -s -X POST https://api.github.com/repos/$REPOSITORY/releases \
-H "Authorization: token $GITHUB_TOKEN" \
-d @- <<EOF
{
  "tag_name": "$version",
  "target_commitish": "$sha",
  "name": "$version",
  "body": "Automated canary release for $version\n",
  "draft": false,
  "prelease": true
}
EOF
