import { rollupConfig } from '@vertexwebsdk/build';

export default rollupConfig({
  external: ['@vertexvis/viewer/loader', '@vertexvis/viewer/assets'],
});
