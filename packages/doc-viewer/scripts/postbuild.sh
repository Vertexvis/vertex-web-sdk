#!/usr/bin/env bash

set -euo pipefail

cp ../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs ./assets
cp $(pwd)/dist/esm/index.js $(pwd)/dist/esm/index.mjs
cp $(pwd)/dist/esm/loader.js $(pwd)/dist/esm/loader.mjs
cp $(pwd)/dist/index.cjs.js $(pwd)/dist/index.cjs
cp $(pwd)/loader/index.cjs.js $(pwd)/loader/index.cjs
mkdir -p $(pwd)/dist/cjs
printf '{\n  "type": "commonjs"\n}\n' > $(pwd)/dist/cjs/package.json
