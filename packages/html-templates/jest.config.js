const jestConfig = require('@vertexvis/jest-config-vertexvis/jest.config');

module.exports = {
  ...jestConfig,
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
