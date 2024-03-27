#!/bin/bash

set -e

. "$(pwd)"/scripts/utils.sh

function __read_summary() {
  READING_SUMMARY=1
  LINE_REGEX="^[ ]*-.*"
  SUMMARY_CONTENTS=""
  while IFS="" read -r line; do
    if [[ "$line" == "##"* ]] && [[ ! "$line" == *"## Summary"* ]]; then
      READING_SUMMARY=0
    elif [[ "$line" =~ $LINE_REGEX ]] && [[ $READING_SUMMARY -ne 0 ]]; then
      SUMMARY_CONTENTS="$SUMMARY_CONTENTS\n${line//$'\r'/}"
    fi
  done < <(printf "$1")

  echo "$SUMMARY_CONTENTS"
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

    SUMMARY=$(__read_summary "$DESC")
    
    echo "Release Notes:$SUMMARY\n"
  else
    echo ""
  fi
}
