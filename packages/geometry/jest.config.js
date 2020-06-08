const jestConfig = require('@vertexvis/jest-config-vertexvis/jest.config');

module.exports = {
  ...jestConfig,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
