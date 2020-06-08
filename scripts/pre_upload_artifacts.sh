#!/bin/bash

packages=`cat lerna.json | jq -r '.packages[]'`
package_directories=($packages)

mkdir dist

for package_path in "${package_directories[@]}"; do 
  dist_directory="$package_path/dist"

  if test -d $dist_directory; then
    mkdir -p dist/$package_path
    cp -r $dist_directory dist/$package_path
  else
    echo "Package at path $package_path does not have a dist directory. Skipping."
  fi
done
