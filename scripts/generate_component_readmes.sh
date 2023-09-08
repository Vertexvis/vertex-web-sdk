#/bin/sh
#
# Script to generate the components README.

set -e

components_dir=./src/components/
create_component_bullet() {
  echo "- [\<vertex-${1}>]($components_dir$1)"
}

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

printf '%b' "$names"
