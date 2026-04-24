// Jest configuration that shared between StencilJS and the Jest config that's
// needed by IDE plugins.
module.exports = {
  collectCoverageFrom: ['./src/**', '!./src/__*__/**', '!./src/testing'],
  coveragePathIgnorePatterns: ['./src/assets/*', './src/polyfill/*'],
  coverageThreshold: {
    global: {
      branches: 68,
      functions: 80,
      lines: 86,
      statements: 85,
    },
  },
  roots: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^pdfjs-dist/legacy/build/pdf\\.mjs$': '<rootDir>/src/__mocks__/pdfjs-mock.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.console.js', '<rootDir>/src/__setup__/polyfills.ts', '<rootDir>/src/__setup__/resize-observer.ts'],
};
