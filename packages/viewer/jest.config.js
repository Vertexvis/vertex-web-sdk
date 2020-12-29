const jestConfig = require('@stencil/core/testing/jest-preset.js');

module.exports = {
  ...jestConfig,
  setupFilesAfterEnv: ['<rootDir>/src/__setup__/setupEvents'],
};
