import { createRequire } from 'node:module';

const modulePath = new URL('../dist/components/vertex-document-viewer.js', import.meta.url);
const require = createRequire(import.meta.url);

try {
  await import(modulePath.href);
  console.log('Imported vertex-document-viewer.js in Node successfully.');
} catch (error) {
  console.error('Failed to import vertex-document-viewer.js in Node.');
  throw error;
}

try {
  require.resolve('@vertexvis/doc-viewer/dist/doc-viewer/doc-viewer.css');
  require.resolve('@vertexvis/doc-viewer/dist/types/index.d.ts');
  require.resolve('@vertexvis/doc-viewer/assets/pdf.worker.min.mjs');
  console.log('Resolved legacy deep dist and asset subpaths successfully.');
} catch (error) {
  console.error('Failed to resolve legacy deep dist or asset subpaths.');
  throw error;
}
