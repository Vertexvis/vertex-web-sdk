#!/bin/bash

packages=`cat lerna.json | jq -r '.packages[]'`
package_directories=($packages)

for package_path in "${package_directories[@]}"; do 
  dist_directory="dist/$package_path/dist"

  if test -d $dist_directory; then
    cp -r $dist_directory/ $package_path/dist
  else 
    echo "Package at path $package_path does not have a dist directory. Skipping."
  fi
done
