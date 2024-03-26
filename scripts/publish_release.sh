#!/bin/bash

# Internal script to publish packages to NPM.

set -e

. "$(pwd)"/scripts/utils.sh
. "$(pwd)"/scripts/release_notes.sh

version="v$(get_version)"
notes="$(get_release_notes)"
sha="$(git rev-parse HEAD)"

npx lerna publish from-package --yes

curl -s -X POST https://api.github.com/repos/$REPOSITORY/releases \
-H "Authorization: token $GITHUB_TOKEN" \
-d @- <<EOF
{
  "tag_name": "$version",
  "target_commitish": "$sha",
  "name": "$version",
  "body": "Automated release for $version<br/><br/>$notes",
  "draft": false,
  "prelease": false
}
EOF
