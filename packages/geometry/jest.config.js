const jestConfig = require('@vertexvis/jest-config-vertexvis/jest.config');

module.exports = {
  ...jestConfig,
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
