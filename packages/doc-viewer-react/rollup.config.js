import { rollupConfig } from '@vertexwebsdk/build';
import copy from 'rollup-plugin-copy';

const baseConfig = rollupConfig({ external: ['@vertexvis/doc-viewer/loader'] });

export default {
  ...baseConfig,
  plugins: [
    copy({
      targets: [
        {
          src: '../doc-viewer/src/assets/pdf.worker.min.mjs',
          dest: 'dist/assets',
        },
      ],
    }),
    ...baseConfig.plugins,
  ],
};
