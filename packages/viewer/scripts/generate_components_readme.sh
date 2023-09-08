#/bin/sh
#
# Script to generate the components README.

set -e

components_dir=./src/components/

create_lib_dir() {
  if ! test -d ../../.lib
  then
    mkdir ../../.lib
  fi
}

install_mo() {
  create_lib_dir

  if ! test -x ../../.lib/mo
  then
    curl -sSL https://raw.githubusercontent.com/tests-always-included/mo/master/mo -o mo
    chmod +x mo
    mv mo ../../.lib/mo
  fi
}

create_component_bullet() {
  echo "- [\<vertex-${1}>]($components_dir$1)"
}

install_mo

top_level_components=("viewer", "scene-tree")
directories=$(ls -d $components_dir*/)

for component in $directories; do
  name=${component#"$components_dir"}
  name=${name%"/"}

  if [[ ${top_level_components[@]} =~ "$name" ]]; then
    names="$(create_component_bullet $name)\n$names"
  else 
    names="  $(create_component_bullet $name)\n$names"
  fi
done

export readmes=$(printf '%b' "$names")
cat ./src/components/README.template.md | ../../.lib/mo > ./src/components/README.md