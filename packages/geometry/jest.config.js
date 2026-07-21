import commonJestConfig from '@vertexvis/jest-config-vertexvis';

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
