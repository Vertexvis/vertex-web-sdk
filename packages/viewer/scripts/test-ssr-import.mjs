const modulePath = new URL(
  '../dist/components/vertex-viewer.js',
  import.meta.url
);

try {
  await import(modulePath.href);
  console.log('Imported vertex-viewer.js in Node successfully.');
} catch (error) {
  console.error('Failed to import vertex-viewer.js in Node.');
  throw error;
}
