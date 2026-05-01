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
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.console.js'],
  coverageThreshold: {
    global: {
      branches: 78,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
};
