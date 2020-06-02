# Vertex Web Monorepo

Welcome to the Vertex Web repo. This is a monorepo that contains our front-end
libraries and sdks at Vertex.

## Structure

- `./packages`: The packages to be made available on NPM. This directory contains
  subdirectories that represent different individual packages and fall under two different categories:
  - `libraries`: These are packages that are intended to be
    reusable across other applications and/or libraries. These are typically
    intended to be used internally.
  - `sdks`: Vertex's public facing SDKs.

- `./scripts`: The scripts directory contains Bash scripts for managing the
  project.

## Setup & Installing

1. Clone the repo. `git clone git@github.com:Vertexvis/vertex-web-sdks.git`
2. Install top-level dependencies. `yarn install`
3. Bootstrap the project. `yarn bootstrap`

### VS Code Workspaces

This repository contains a script to generate a VS Code workspace file. With VS
Code workspaces, extensions are run within the context of sub-projects, so
features like Jest debugging still work.

The workspace file will be created automatically when running `yarn install`.
Otherwise you can generate the file manually by running `yarn generate:vscode-workspace`.

Running `code ./vertex-web-sdks.code-workspace` will open VS Code workspace.

## Building

The project exposes a top-level script to build (`yarn build`) any project
that exposes a `build` NPM script. 

Running a `yarn build` at the top-level will run `lerna run build`, which will execute any 
NPM `build` script for each package specified in the `lerna.json` file.

## Formatting & Linting

The project exposes two top-level scripts to format (`yarn format`) and lint
(`yarn lint`) using `lerna run` to execute any NPM `lint` or `format` scripts 
present for each package.

These scripts are run during CI builds and will fail your build if it contains
unformatted code or lint errors.

## Testing

The project exposes a top-level script to test (`yarn test`) using `lerna run` to execute
any NPM `test` scripts present for each package.

Additionally, the project exposes a top-level script to check code coverage (`yarn test:coverage`).

## Publishing NPM packages

Changes to packages are not automatically released based on the initial PR that introduces them.
In order to release a set of changes, the `./scripts/release.sh` script can be used (from master)
to update package versions. This script will run `yarn release`, which will use a CLI wizard provided
through `lerna version` to allow you to perform the version updates to each changed package.

Once the version changes have been configured, the script will push up a release branch. The branch
will be named `release-{{ timestamp }}`, and contain a single "Release Changes" commit, which will
indicate the versions that will be changed when merged.

This branch can then be merged into master, and uses https://github.com/Vertexvis/npm-publish-action 
to publish changed packages to NPM, in addition to pushing up a new tag for each version change.

## Semver

Versioning changes should be based on [semver]. If your package has not reached
a 1.0 milestone, semver rules should still apply, but minor will be treated as
major and patch will be treated as minor.

[semver]: https://semver.org/
