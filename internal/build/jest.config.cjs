const jestConfig = require('@vertexvis/jest-config-vertexvis/jest.config');

module.exports = {
  ...jestConfig,
  setupFilesAfterEnv: [
    ...(jestConfig.setupFilesAfterEnv || []),
    '<rootDir>/../../jest.setup.console.js',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 80,
      statements: 85,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
};
