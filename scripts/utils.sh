#!/bin/sh

function get_version {
  jq -r '.version' ./lerna.json
}
