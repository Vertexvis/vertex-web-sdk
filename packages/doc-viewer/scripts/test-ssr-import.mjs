const modulePath = new URL('../dist/components/vertex-document-viewer.js', import.meta.url);

try {
  await import(modulePath.href);
  console.log('Imported vertex-document-viewer.js in Node successfully.');
} catch (error) {
  console.error('Failed to import vertex-document-viewer.js in Node.');
  throw error;
}
