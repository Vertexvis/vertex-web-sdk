const config = require('./jest-shared.config');

module.exports = {
  ...config,
  preset: '@stencil/core/testing',
  testRunner: 'jasmine2',
};
