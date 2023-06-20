# Vertex Web SDK

Welcome to the Vertex Web SDK repo. This is a monorepo containing SDKs for the
web platform.

## Packages

| Package      | Version | Description |
| ------------ | ------- | ----------- |
| [@vertexvis/geometry]        | ![npm](https://img.shields.io/npm/v/@vertexvis/geometry)        | 2D/3D geometry utilities. |
| [@vertexvis/stream-api]      | ![npm](https://img.shields.io/npm/v/@vertexvis/stream-api)      | The API client for streaming 3D images. |
| [@vertexvis/utils]           | ![npm](https://img.shields.io/npm/v/@vertexvis/utils)           | General Node and Web utilities used within Vertex. |
| [@vertexvis/html-templates]  | ![npm](https://img.shields.io/npm/v/@vertexvis/html-templates)  | HTML templating utilities used with web components. |
| [@vertexvis/viewer]          | ![npm](https://img.shields.io/npm/v/@vertexvis/viewer)          | The Web SDK containing web components to view 3D models. |
| [@vertexvis/viewer-react]    | ![npm](https://img.shields.io/npm/v/@vertexvis/viewer-react)    | Contains React bindings for Vertex's Web SDK. |

## Documentation

Please refer to our [SDK API documentation](https://vertexvis.github.io/vertex-web-sdk/).

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

## Bumping Versions

The project's release scripts will automatically bump version based on the
`nextBumpVersion` that's specified in the projects `package.json` file. When
making a breaking change, you should run `yarn version:bump` and specify
`minor`. This should be done as part of your PR.

**Note:** minor is being used to signal breaking changes until the Web SDK hits
1.0.

## Releasing

Run `yarn release` to create a release based on the `nextBumpVersion` that's
specified in the projects `package.json` file. This field tracks if the next
version should be a `major`, `minor` or `patch` release.

Run `yarn release:ask` to specify a custom release version.

These script will verify that your working directory is clean, is up-to-date
with master, ask for the release version, generate documentation, and push a
release branch to GitHub.

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
[@vertexvis/geometry]: ./packages/geometry
[@vertexvis/stream-api]: ./packages/stream-api
[@vertexvis/utils]: ./packages/utils
[@vertexvis/html-templates]: ./packages/html-templates
[@vertexvis/viewer]: ./packages/viewer
[@vertexvis/viewer-react]: ./packages/viewer-react

## Examples

These examples make use of more modern EcmaScript features. You'll need a browser that supports ES modules. Most modern browsers (Chrome, Edge, Firefox, Safari) support these features.

- Obtain a `clientId` and `streamKey` following [this guide](https://developer.vertexvis.com/docs/guides/authentication)
- Run `yarn examples:start` to spin up a local development environment.
- Open browser to <http://localhost:8080?clientid=YOUR_CLIENT_ID&streamkey=YOUR_STREAM_KEY> to browse the examples. The development environment supports live refresh, so any changes you make the examples will automatically refresh your browser.

### Contributing Examples

We provide a script that you can run to create a new example. Run `yarn examples:scaffold [name]` to create a new example.
