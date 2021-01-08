import { rollupConfig, rollupCdnConfig } from '@vertexwebsdk/build';

const standardConfig = rollupConfig();
const cdnConfig = rollupCdnConfig({ globalName: 'Vertexvis.Geometry' });

export default typeof standardConfig === 'array'
  ? [...standardConfig, cdnConfig]
  : [standardConfig, cdnConfig];
