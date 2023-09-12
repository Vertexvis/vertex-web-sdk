#/bin/sh
#
# Script to generate SDK documentation.

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

  cat ./.lib/mo
}

install_mo

# Update readme with correct version.
export version=$(../../scripts/generate_version.sh)
export readmes=$(../../scripts/generate_component_readmes.sh)
cat ./README.template.md | ./.lib/mo > README.md
