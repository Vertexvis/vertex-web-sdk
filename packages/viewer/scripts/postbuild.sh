#!/usr/bin/env bash

cp $(pwd)/dist/esm/index.js $(pwd)/dist/esm/index.mjs
cp $(pwd)/dist/esm/loader.js $(pwd)/dist/esm/loader.mjs

$(pwd)/scripts/format-examples.js < $(pwd)/src/components.d.ts > $(pwd)/src/components.d.ts.tmp
yarn -s prettier --write --parser typescript --config ../../.prettierrc.json $(pwd)/src/components.d.ts.tmp
mv $(pwd)/src/components.d.ts.tmp $(pwd)/src/components.d.ts
