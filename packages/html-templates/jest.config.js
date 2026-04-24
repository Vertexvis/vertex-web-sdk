const jestConfig = require('@vertexvis/jest-config-vertexvis/jest.config');

module.exports = {
  ...jestConfig,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  setupFilesAfterEnv: [
    ...(jestConfig.setupFilesAfterEnv || []),
    '<rootDir>/../../jest.setup.console.js',
  ],
  moduleNameMapper: {
    ...jestConfig.moduleNameMapper,
    '^@vertexvis/utils$': '<rootDir>/../utils/src/index.ts',
  },
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 55,
      lines: 55,
      statements: 60,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
};
