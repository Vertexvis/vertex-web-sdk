# Vertex Web SDK

Welcome to the Vertex Web SDK repo. This is a monorepo containing SDKs for the
web platform.

qweqeqwe

## Structure

- `./packages`: Contains platform SDK packages that are published to NPM.
- `./scripts`: Contains Bash scripts for managing the project.

## Setup & Installing

1. Clone the repo. `git clone git@github.com:Vertexvis/vertex-web-sdk.git`
2. Install top-level dependencies. `yarn install`
3. Bootstrap the project. `yarn bootstrap`

### VS Code Workspaces

This repository contains a script to generate a VS Code workspace file. With VS
Code workspaces, extensions are run within the context of sub-projects, so
features like Jest debugging still work.

The workspace file will be created automatically when running `yarn install`.
Otherwise you can generate the file manually by running `yarn generate:vscode-workspace`.

Running `code ./vertex-web-sdk.code-workspace` will open VS Code workspace.

## Building

The project exposes a top-level script to build (`yarn build`) any project
that exposes a `build` NPM script.

Running a `yarn build` at the top-level will run `lerna run build`, which will
execute any NPM `build` script for each package specified in the `lerna.json`
file.

## Formatting & Linting

The project exposes two top-level scripts to format (`yarn format`) and lint
(`yarn lint`) using `lerna run` to execute any NPM `lint` or `format` scripts
present for each package.

These scripts are run during CI builds and will fail your build if it contains
unformatted code or lint errors.

## Testing

The project exposes a top-level script to test (`yarn test`) using `lerna run`
to execute any NPM `test` scripts present for each package.

Additionally, the project exposes a top-level script to check code coverage
(`yarn test:coverage`).

## Releasing

To create a release, run the `yarn release` NPM script. This script will verify
that your working directory is clean, is up-to-date with master, ask for the
release version, generate documentation, and push a release branch to GitHub.

You can then create a PR from the release branch. Once your PR has been approved
and merged, the CI pipeline will automatically publish packages to NPM, tag the
release, and create a release in Github.

If the publishing, open a new PR with any fixes and merge your changes. CI will
attempt to republish the previous release that failed.

## Semver

Versioning changes should be based on [semver]. If your package has not reached
a 1.0 milestone, semver rules should still apply, but minor will be treated as
major and patch will be treated as minor.

[semver]: https://semver.org/
