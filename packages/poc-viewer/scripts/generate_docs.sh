#/bin/sh
#
# Script to generate Viewer SDK documentation.

set -e

create_lib_dir() {
  if ! test -d ./.lib
  then
    mkdir ./.lib
  fi
}

install_mo() {
  create_lib_dir

  if ! test -x ./.lib/mo
  then
    curl -sSL https://git.io/get-mo -o mo
    chmod +x mo
    mv mo ./.lib/mo
  fi
}

install_mo

# Update readme with correct version.
export version=`cat package.json | jq -r '.version'`
cat ./README.template.md | ./.lib/mo > README.md
