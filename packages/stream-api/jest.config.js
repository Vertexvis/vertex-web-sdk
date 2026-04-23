const jestConfig = require('@vertexvis/jest-config-vertexvis/jest.config');

module.exports = {
  ...jestConfig,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  moduleNameMapper: {
    ...jestConfig.moduleNameMapper,
    '^@vertexvis/utils$': '<rootDir>/../utils/src/index.ts',
  },
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 65,
      statements: 65,
    },
  },
  coveragePathIgnorePatterns: ['src/testing'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
};
