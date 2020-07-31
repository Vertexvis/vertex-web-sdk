#!/bin/sh

# Internal script to publish packages to NPM.

set -e

npx lerna publish from-package --yes

curl -s -X POST https://api.github.com/repos/$REPOSITORY/releases \
-H "Authorization: token $GITHUB_TOKEN" \
-d @- <<EOF
{
  "tag_name": "$version",
  "target_commitish": "$sha",
  "name": "$version",
  "body": "Automated release for $version\n",
  "draft": false,
  "prelease": false
}
EOF
