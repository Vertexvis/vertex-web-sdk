const jestConfig = require('@vertexvis/jest-config-vertexvis/jest.config');

module.exports = {
  ...jestConfig,
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 65,
      statements: 65,
    },
  },
};
