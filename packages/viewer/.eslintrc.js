module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react'],
  extends: '@vertexvis/vertexvis-typescript',
  rules: {
    'react/jsx-uses-vars': 'error',
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

          // Fields
          'public-field',
          'protected-field',
          'private-field',

          'decorated-field',
          'static-field',
          'instance-field',
          'abstract-field',

          'field',

          // Constructor
          'constructor',

          // Methods
          'public-method',
          'protected-method',
          'private-method',

          'static-method',
          'instance-method',
          'abstract-method',

          // "decorated-method" left out here, as these methods are often defined after the
          // Stencil lifecycle instance-methods, but before other instance-methods

          'method',
        ],
      },
    ],
  },
  overrides: [
    {
      // @typescript-eslint/typescript-estree v5.9.x does not support TypeScript 5's
      // decorator AST changes (decorators moved from node.decorators to node.modifiers).
      // This causes the ESTree produced for Stencil component files to be missing both
      // decorator references and the export modifier, resulting in false-positive
      // "defined but never used" errors for decorator imports and component class names.
      // TypeScript compilation (tsc) still catches real unused-variable issues here.
      files: ['src/components/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
