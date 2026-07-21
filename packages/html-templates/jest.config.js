import commonJestConfig from '@vertexvis/jest-config-vertexvis';

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
