// Jest configuration that shared between StencilJS and the Jest config that's
// needed by IDE plugins.
export default {
  collectCoverageFrom: ['./src/**', '!./src/__*__/**', '!./src/testing'],
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
    '^\\./worker-url$': '<rootDir>/src/workers/__mocks__/worker-url.ts',
  },
  setupFilesAfterEnv: [
    '<rootDir>/../../jest.setup.console.js',
    '<rootDir>/src/__setup__/polyfills.ts',
  ],
};
