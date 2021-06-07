import { isPromise } from '../typeGuards';

describe(isPromise, () => {
  it('returns true if a promise', () => {
    const promise = Promise.resolve();
    expect(isPromise(promise)).toBe(true);
  });

  it('returns true if promise like', () => {
    const promise = {
      then: () => undefined,
      catch: () => undefined,
      finally: () => undefined,
    };
    expect(isPromise(promise)).toBe(true);
  });

  it('returns false if not promise like', () => {
    const promise = { then: '', catch: '', finally: '' };
    expect(isPromise(promise)).toBe(false);
  });
});
