#!/bin/bash

function get_version {
  jq -r '.version' ./lerna.json
}

function npx_ignore_scripts {
  npx --ignore-scripts "$@"
}
