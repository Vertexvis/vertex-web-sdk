#!/bin/sh

set -e

. "$(pwd)"/scripts/utils.sh

if test "$(git rev-parse --abbrev-ref HEAD) != master"
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

timestamp=$(date "+%s")
local_branch=release-temp/$timestamp
git checkout -tb $local_branch

npx lerna version --no-push --no-git-tag-version --exact

version="v$(get_version)"
remote_branch="release/$version"

message="Release Changes\n"

git commit -a -m "Release $version"
git push origin $local_branch:$remote_branch
git checkout master
git branch -D $local_branch

echo "Pushed $remote_branch. Open a PR and merge to publish the release."
