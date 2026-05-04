import { rollupConfig } from '@vertexwebsdk/build';

const baseConfig = rollupConfig({ external: [/^@vertexvis\/viewer/] });

// Preserve 'use client' directive for React Server Components compatibility.
const useClientPlugin = {
  name: 'use-client-directive',
  renderChunk(code) {
    return { code: `'use client';\n${code}`, map: null };
  },
};

const addUseClient = (config) => ({
  ...config,
  onwarn(warning, warn) {
    // Suppress the 'use client' directive warning since we handle it in renderChunk.
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
    warn(warning);
  },
  plugins: [...(config.plugins || []), useClientPlugin],
});

export default Array.isArray(baseConfig)
  ? baseConfig.map(addUseClient)
  : addUseClient(baseConfig);
