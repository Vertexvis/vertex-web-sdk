import vertexvisTypescript from '@vertexvis/eslint-config-vertexvis-typescript';

// eslint-plugin-prettier was removed from the shared config. Keep legacy
// disable comments valid while formatting remains a separate Prettier step.
const prettierCompatibilityPlugin = {
  rules: {
    prettier: {
      meta: { schema: [] },
      create: () => ({}),
    },
  },
};

export default [
  { ignores: ['dist/**', 'coverage/**', '.rpt2_cache/**'] },
  ...vertexvisTypescript,
  {
    plugins: { prettier: prettierCompatibilityPlugin },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
];
