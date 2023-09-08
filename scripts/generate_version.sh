#/bin/sh
#
# Script to generate SDK documentation.

set -e

echo `cat package.json | jq -r '.version'`
