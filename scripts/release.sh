#!/bin/sh

# Check that the release is being created from master
if test -z "$(git branch | grep -E '^[*] master$')"
then
  echo "Release branch must be created from master."
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

# Ensure remote tags are pulled before running `lerna version` 
git pull

remote_tags=`git ls-remote --tags`
timestamp=$(date "+%s")
local_branch=release-$timestamp
git checkout -tb $local_branch

yarn change
message="Release Changes\n"
packages=`cat lerna.json | jq -r '.packages[]'`
package_directories=($packages)

for package_path in "${package_directories[@]}"; do 
  package_json="$package_path/package.json"
  package_name=`jq '.name' -r $package_json`
  package_version=`jq '.version' -r $package_json`
  package_tag="${package_name}_v${package_version}"

  if ! test -n "$(grep $package_tag <<< $remote_tags)"
  then
    message+="$package_name v$package_version\n"
  fi
done

echo $message > temp.txt

git commit -a --file="temp.txt"
git push origin $local_branch
git checkout master
git branch -D $local_branch

rm temp.txt

echo "Pushed $local_branch. Open a PR and merge to publish the release."
