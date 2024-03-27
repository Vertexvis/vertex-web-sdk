#!/bin/bash

set -e

. "$(pwd)"/scripts/utils.sh

function __read_summary() {
  READING_SUMMARY=1
  LIST_ITEM_REGEX="^[ ]*-.*"
  RELEASE_SUMMARY=""

  while IFS="" read -r line; do
    if [[ "$line" == "##"* ]] && [[ ! "$line" == *"## Summary"* ]]; then
      # If we encounter another header after the Summary header, ignore future lines
      READING_SUMMARY=0
    elif [[ "$line" =~ $LIST_ITEM_REGEX ]] && [[ $READING_SUMMARY -ne 0 ]]; then
      # If we encounter a list item in the summary, append it to the release summary
      RELEASE_SUMMARY="$RELEASE_SUMMARY\n${line//$'\r'/}"
    fi
  done < <(printf "$1")

  echo "$RELEASE_SUMMARY"
}

function get_release_notes() {
  PR_NUMBER=$(git log -1 | grep -oE '(\(#)([0-9]*)[)]' | grep -oE '[0-9]*')

  if [ ! -z "$PR_NUMBER" ]; then
    DESC=$(
      curl -L https://api.github.com/repos/$REPOSITORY/pulls/$PR_NUMBER \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: token $GITHUB_TOKEN" \
        | jq '.body'
    )

    RELEASE_SUMMARY=$(__read_summary "$DESC")
    
    echo "Release Notes:$RELEASE_SUMMARY\n"
  else
    echo ""
  fi
}
