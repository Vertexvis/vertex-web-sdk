import vertexvisTypescript from '@vertexvis/eslint-config-vertexvis-typescript';
import react from 'eslint-plugin-react';

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
  { ignores: ['dist/**', 'coverage/**', 'www/**', 'loader/**', 'geometry/**'] },
  ...vertexvisTypescript,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { prettier: prettierCompatibilityPlugin, react },
    rules: {
      'react/jsx-uses-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'none', caughtErrors: 'none' },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'lodash', message: 'Use lodash-es instead.' },
            { name: 'lodash-es', message: 'Use lodash-es submodules instead.' },
            {
              name: '@stencil/core',
              importNames: ['readTask', 'writeTask'],
              message:
                'This function does not work in tests. Use imports from ./src/utils/stencil instead.',
            },
          ],
          patterns: ['lodash', 'lodash/*'],
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
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
];
