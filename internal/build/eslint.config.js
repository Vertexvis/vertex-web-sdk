import vertexvisTypescript from '@vertexvis/eslint-config-vertexvis-typescript';

export default [
  { ignores: ['dist/**', 'coverage/**'] },
  ...vertexvisTypescript,
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
];
