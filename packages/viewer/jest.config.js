import config from './jest-shared.config';

export default {
  ...config,
  preset: '@stencil/core/testing',
  testRunner: 'jasmine2',
};
