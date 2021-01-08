import { rollupConfig } from '@vertexwebsdk/build';

export default rollupConfig({
  entrypoint: 'src/utils.ts',
  globalName: 'Vertexvis.Viewer',
});
