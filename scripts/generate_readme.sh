#/bin/sh
#
# Script to generate the top-level SDK README.

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
    curl -sSL https://raw.githubusercontent.com/tests-always-included/mo/master/mo -o mo
    chmod +x mo
    mv mo ./.lib/mo
  fi
}

create_component_bullet() {
  echo "- [\<vertex-$1>](./packages/viewer/src/components/$1)"
}

install_mo

top_level_components=("viewer", "scene-tree")

directories=$(ls ./packages/viewer/src/components/)
for component in $directories; do
  if [[ ${top_level_components[@]} =~ $component ]]; then
    names="$names$(create_component_bullet $component)\n"
  else 
    spaces="  "
    names="$names  $(create_component_bullet $component)\n"
  fi
done

export readmes=$(printf '%b' "$names")
cat ./README.template.md | ./.lib/mo > README.md