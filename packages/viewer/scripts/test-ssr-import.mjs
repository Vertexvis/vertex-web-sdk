import { createRequire } from 'node:module';

const modulePath = new URL(
  '../dist/components/vertex-viewer.js',
  import.meta.url
);
const require = createRequire(import.meta.url);

try {
  await import(modulePath.href);
  console.log('Imported vertex-viewer.js in Node successfully.');
} catch (error) {
  console.error('Failed to import vertex-viewer.js in Node.');
  throw error;
}

try {
  require.resolve('@vertexvis/viewer/dist/viewer/viewer.css');
  require.resolve('@vertexvis/viewer/dist/types/index.d.ts');
  console.log('Resolved legacy deep dist subpaths successfully.');
} catch (error) {
  console.error('Failed to resolve legacy deep dist subpaths.');
  throw error;
}
