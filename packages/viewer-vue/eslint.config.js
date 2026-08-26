import vertexvisTypescript from '@vertexvis/eslint-config-vertexvis-typescript';

export default [
  { ignores: ['dist/**', 'coverage/**', 'src/generated/**'] },
  ...vertexvisTypescript,
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
];
