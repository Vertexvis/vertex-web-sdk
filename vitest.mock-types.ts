import type {
  Mock as VitestMock,
  MockInstance as VitestMockInstance,
} from 'vitest';

/** Preserve the old return-value parameter used by shared test fixtures. */
export type Mock<T = any> = VitestMock<(...args: any[]) => T>;
export type MockInstance<T = any> = VitestMockInstance<(...args: any[]) => T>;
