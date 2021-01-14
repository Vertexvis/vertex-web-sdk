#!/bin/bash

# Internal script to publish packages to NPM.

set -e

. "$(pwd)"/scripts/utils.sh

version="v$(get_version)"
sha="$(git rev-parse HEAD)"
body="Automated release for $version"

npx lerna publish from-package --yes

git tag -a "$version" -m "$body"
git push --tags

curl -s -X POST https://api.github.com/repos/$REPOSITORY/releases \
-H "Authorization: token $GITHUB_TOKEN" \
-d @- <<EOF
{
  "tag_name": "$version",
  "name": "$version",
  "draft": false,
  "prelease": false
}
EOF
