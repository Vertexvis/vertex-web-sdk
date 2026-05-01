#!/usr/bin/env bash

set -euo pipefail

# Postbuild keeps the published package compatible with both ESM and CommonJS
# after the repo moved to `type: module`, and it rewrites generated component
# docs using the local formatter helper before packaging.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PACKAGE_DIR=$(cd "${SCRIPT_DIR}/.." && pwd)
ROOT_DIR=$(cd "${PACKAGE_DIR}/../.." && pwd)

cp "${PACKAGE_DIR}/dist/esm/index.js" "${PACKAGE_DIR}/dist/esm/index.mjs"
cp "${PACKAGE_DIR}/dist/esm/loader.js" "${PACKAGE_DIR}/dist/esm/loader.mjs"
cp "${PACKAGE_DIR}/dist/index.cjs.js" "${PACKAGE_DIR}/dist/index.cjs"
cp "${PACKAGE_DIR}/loader/index.cjs.js" "${PACKAGE_DIR}/loader/index.cjs"
mkdir -p "${PACKAGE_DIR}/dist/cjs"
printf '{\n  "type": "commonjs"\n}\n' > "${PACKAGE_DIR}/dist/cjs/package.json"

node "${SCRIPT_DIR}/format-examples.js" < "${PACKAGE_DIR}/src/components.d.ts" > "${PACKAGE_DIR}/src/components.d.ts.tmp"
yarn -s prettier --write --parser typescript --config "${ROOT_DIR}/.prettierrc.json" "${PACKAGE_DIR}/src/components.d.ts.tmp"
mv "${PACKAGE_DIR}/src/components.d.ts.tmp" "${PACKAGE_DIR}/src/components.d.ts"
