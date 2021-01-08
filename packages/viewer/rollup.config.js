import { rollupCdnConfig } from '@vertexwebsdk/build';

export default rollupCdnConfig({
  entrypoint: 'src/utils.ts',
  globalName: 'Vertexvis.Viewer',
});
