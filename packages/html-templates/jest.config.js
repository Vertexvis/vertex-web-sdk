// import jestConfig from '@vertexvis/jest-config-vertexvis/jest.config';
// TODO: return to using build-tool jest-config once supports ESM
const commonJestConfig = {
  preset: 'ts-jest',
  collectCoverageFrom: ['**/src/**', '!**/src/__*__/**'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/.rpt2_cache/',
  ],
};

export default {
  ...commonJestConfig,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.console.js'],
  moduleNameMapper: {
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
