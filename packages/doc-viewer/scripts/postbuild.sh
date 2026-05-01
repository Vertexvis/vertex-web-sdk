#!/usr/bin/env bash

set -euo pipefail

# Postbuild restores the file layout expected by consumers after the package
# moved to `type: module`, and copies the PDF worker asset into the published
# package alongside the generated dual-module entrypoints.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PACKAGE_DIR=$(cd "${SCRIPT_DIR}/.." && pwd)
ROOT_DIR=$(cd "${PACKAGE_DIR}/../.." && pwd)

cp "${ROOT_DIR}/node_modules/pdfjs-dist/build/pdf.worker.min.mjs" "${PACKAGE_DIR}/assets"
cp "${PACKAGE_DIR}/dist/esm/index.js" "${PACKAGE_DIR}/dist/esm/index.mjs"
cp "${PACKAGE_DIR}/dist/esm/loader.js" "${PACKAGE_DIR}/dist/esm/loader.mjs"
cp "${PACKAGE_DIR}/dist/index.cjs.js" "${PACKAGE_DIR}/dist/index.cjs"
cp "${PACKAGE_DIR}/loader/index.cjs.js" "${PACKAGE_DIR}/loader/index.cjs"
mkdir -p "${PACKAGE_DIR}/dist/cjs"
printf '{\n  "type": "commonjs"\n}\n' > "${PACKAGE_DIR}/dist/cjs/package.json"
