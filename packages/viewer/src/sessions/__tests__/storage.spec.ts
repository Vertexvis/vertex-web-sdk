import { upsertStorageEntry, getStorageEntry } from '../storage';

class MockLocalStorage {
  private storage: Record<string, string>;

  public constructor(storage?: Record<string, string>) {
    this.storage = storage || {};
  }

  public getItem(key: string): string {
    return this.storage[key];
  }

  public setItem(key: string, value: string): void {
    this.storage[key] = value;
  }

  public getStorage(): Record<string, string> {
    return this.storage;
  }
}

const localStorageKey = 'testkey';

describe('storage', () => {
  describe(upsertStorageEntry, () => {
    let localStorage;
    beforeEach(() => {
      localStorage = new MockLocalStorage();
    });

    it('inserts the item if not present', () => {
      const value = { test: 'value' };
      upsertStorageEntry(
        localStorageKey,
        { test: 'value' },
        () => localStorage
      );

      expect(localStorage.getStorage()).toMatchObject({
        [localStorageKey]: JSON.stringify(value),
      });
    });

    it('adds the item to the existing values if already present', () => {
      const value1 = { test1: 'value1' };
      const value2 = { test2: 'value2' };
      localStorage = new MockLocalStorage({
        [localStorageKey]: JSON.stringify(value1),
      });

      upsertStorageEntry(localStorageKey, value2, () => localStorage);

      expect(localStorage.getStorage()).toMatchObject({
        [localStorageKey]: JSON.stringify({ ...value1, ...value2 }),
      });
    });
  });

  describe(getStorageEntry, () => {
    let localStorage;
    beforeEach(() => {
      localStorage = new MockLocalStorage();
    });

    it('fetches the item if it exists and applies the provided transform', () => {
      const value1 = { test1: 'value1' };
      localStorage = new MockLocalStorage({
        [localStorageKey]: JSON.stringify(value1),
      });

      expect(
        getStorageEntry(
          localStorageKey,
          (entry) => ({ ...entry, newValue: 'value' }),
          () => localStorage
        )
      ).toMatchObject({
        ...value1,
        newValue: 'value',
      });
    });

    it('returns nothing if the item does not exist', () => {
      expect(
        getStorageEntry(
          localStorageKey,
          (entry) => entry,
          () => localStorage
        )
      ).toBeUndefined();
    });
  });
});
