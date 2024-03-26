#!/bin/bash

set -e

. "$(pwd)"/scripts/utils.sh

function trim_comments() {
  echo $1 | sed -r "s/(^\")|(\"$)//g" | sed -r 's/(<!--[^->]*-->)//g'
}

function get_release_notes() {
  PR_NUMBER=$(git log -1 | grep -oE '(\(#)([0-9]*)[)]' | grep -oE '[0-9]*')

  DESC=$(
    curl -L https://api.github.com/repos/$REPOSITORY/pulls/$PR_NUMBER \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: token $GITHUB_TOKEN" \
      | jq '.body'
  )

  DESC=$(trim_comments "$DESC")
  RELEASE_NOTES=$(echo $DESC | grep -oE '[#]{2} Summary.*' | grep -oE '[-]([^\\])*')

  echo "Release Notes:<br/>"$RELEASE_NOTES | sed -r 's/[-]/<br\/>-/g'
}
