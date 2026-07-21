import vertexvisTypescript from '@vertexvis/eslint-config-vertexvis-typescript';

export default [
  { ignores: ['dist/**', 'coverage/**', 'www/**', 'loader/**', 'assets/**'] },
  ...vertexvisTypescript,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@stencil/core',
              importNames: ['readTask', 'writeTask'],
              message: 'This function does not work in tests. Use imports from ./src/utils/stencil instead.',
            },
          ],
        },
      ],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'signature',
            'public-field',
            'protected-field',
            'private-field',
            'decorated-field',
            'static-field',
            'instance-field',
            'abstract-field',
            'field',
            'constructor',
            'public-method',
            'protected-method',
            'private-method',
            'static-method',
            'instance-method',
            'abstract-method',
            'method',
          ],
        },
      ],
    },
  },
];
