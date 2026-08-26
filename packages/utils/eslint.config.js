import vertexvisTypescript from '@vertexvis/eslint-config-vertexvis-typescript';

export default [
  { ignores: ['dist/**', 'coverage/**', '.rpt2_cache/**'] },
  ...vertexvisTypescript,
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
];
