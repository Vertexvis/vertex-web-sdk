module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: '@vertexvis/vertexvis-typescript',
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
};
