module.exports = {
  preset: '@stencil/core/testing',
  moduleNameMapper: {
    '^worker:(.+)': '<rootDir>/src/__mocks__/web-workers.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__setup__/polyfills.ts'],
};
