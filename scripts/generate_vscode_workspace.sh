#!/bin/bash
#
# Generates a workspace file that can be opened in VS Code. See
# https://code.visualstudio.com/docs/editor/multi-root-workspaces about VS Code
# workspaces.

set -e

shadow_dir="./.shadowroot"
package_file="./package.json"
extensions_file="./.vscode/extensions.json"
settings_file="./.vscode/settings.json"
workspace_file="./vertex-web-sdks.code-workspace"

update_workspace_projects() {
  tmp_workspace_file="$workspace_file.tmp"
  packages=`jq -r '.workspaces[]' $package_file`
  package_directories=($packages)

  folders='[ '
  for package_path in "${package_directories[@]}"; do
    package_json="$package_path/package.json"
    package_name=`jq '.name' -r $package_json`
    folders="$folders { \"name\": \"$package_name\", \"path\": \"$package_path\" },"
  done
  folders="${folders%?} ]"

  root_files="[{\"name\": \"Project Files\", \"path\": \""$shadow_dir"\"}]"
  scripts="[{\"name\": \"Project Scripts\", \"path\": \"scripts\"}]"
  github="[{\"name\": \"Github Settings\", \"path\": \".github\"}]"
  vscode="[{\"name\": \"VS Code Settings\", \"path\": \".vscode\"}]"

  extensions=`cat $extensions_file`
  settings=`cat $settings_file`

  jq --argjson folders "$folders" --argjson extensions "$extensions" --argjson settings "$settings" \
    '. | .folders = $folders | .settings = $settings | .extensions = $extensions' $workspace_file \
    > $tmp_workspace_file && mv $tmp_workspace_file $workspace_file
}

update_shadow_root() {
  if ! test -d "$shadow_dir"
  then
    mkdir "$shadow_dir"
  fi

  root_files=`ls -p -a | grep -v /`

  for file in $root_files
  do
    if ! test -r "$shadow_dir/$file"
    then
      ln -s "../$file" "$shadow_dir/$file"
    fi
  done
}

create_workspace_file() {
  if ! test -r "$workspace_file"
  then
    touch "$workspace_file"
    jq -n '{"folders": [], "settings": {}}' > $workspace_file
  fi
}

main() {
  create_workspace_file
  update_shadow_root
  update_workspace_projects
}

main
