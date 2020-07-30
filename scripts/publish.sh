#!/bin/sh

# Internal script to publish packages to NPM.

set -e

sha=$(git rev-parse HEAD)
version=v`jq -r '.version' ./lerna.json`

git fetch --tags

if test -z `git tag --list $version`
then
  echo "Detected release for $version"

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
else
  echo "Skipping publish of $version"
fi
