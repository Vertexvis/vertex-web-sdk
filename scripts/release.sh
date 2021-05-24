#!/bin/bash

set -e

. "$(pwd)"/scripts/utils.sh

if test "$(git rev-parse --abbrev-ref HEAD)" != "master"
then
  echo "Cannot release from non-master branch"
  exit 1
fi

# Check if the local repo is clean
if test -n "$(git status --porcelain --untracked-files=no)"
then
  echo "Working directory contains uncommitted changes."
  exit 1
fi

# Check if upstream has changes
if test -n "$(git status -sb --porcelain origin | grep "\[behind")"
then
  echo "Working directory is behind upstream. Pull upstream and try again."
  exit 1
fi

# Create temp branch to run release scripts
timestamp=$(date "+%s")
local_branch=release-temp/$timestamp
git checkout -tb $local_branch

# Bump version and generate docs with updated versions
if test -n "$ASK_VERSION"
then
  npx lerna version --no-push --no-git-tag-version --exact
else
  next_bump=`jq -r '.nextVersionBump' package.json`
  npx lerna version --no-push --no-git-tag-version --exact "$next_bump"
fi

yarn install
yarn generate:docs

# Set the next version bump back to patch
json=`jq '.nextVersionBump = "patch"' package.json`
echo "$json" > package.json

version="v$(get_version)"
remote_branch="release/$version"

# Push branch to upstream
git commit -a -m "Release $version"
git push origin $local_branch:$remote_branch
git checkout master

# Cleanup
git branch -D $local_branch

echo "Pushed $remote_branch. Open a PR and merge to publish the release."
