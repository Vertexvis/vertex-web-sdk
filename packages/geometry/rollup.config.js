import { rollupCdnConfig, rollupConfig } from '@vertexwebsdk/build';

const standardConfig = rollupConfig();
const cdnConfig = rollupCdnConfig();

export default typeof standardConfig === 'array'
  ? [...standardConfig, cdnConfig]
  : [standardConfig, cdnConfig];
