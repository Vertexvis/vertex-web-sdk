import commonJestConfig from '@vertexvis/jest-config-vertexvis';

export default {
  ...commonJestConfig,
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.console.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 88,
      statements: 88,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
};
