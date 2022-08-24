import { rollupCdnConfig, rollupConfig } from '@vertexwebsdk/build';

const standardConfig = rollupConfig();
const cdnConfig = rollupCdnConfig();

export default Array.isArray(standardConfig)
  ? [...standardConfig, cdnConfig]
  : [standardConfig, cdnConfig];
