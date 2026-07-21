import jestConfig from '@vertexvis/jest-config-vertexvis';

export default {
  ...jestConfig,
  setupFilesAfterEnv: [
    ...(jestConfig.setupFilesAfterEnv || []),
    '<rootDir>/../../jest.setup.console.js',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 80,
      statements: 85,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
};
