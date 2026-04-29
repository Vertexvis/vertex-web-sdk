export enum StorageKeys {
  DEVICE_ID = 'vertexvis:device-id',
}

function getLocalStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Local storage is not available.');
  }

  return window.localStorage;
}

export function upsertStorageEntry<T>(
  key: string,
  values: Record<string, T>,
  storage: Storage = getLocalStorage()
): void {
  const existing = storage.getItem(key);

  if (existing != null) {
    const updated = { ...JSON.parse(existing), ...values };
    storage.setItem(key, JSON.stringify(updated));
  } else {
    storage.setItem(key, JSON.stringify(values));
  }
}

export function getStorageEntry<T>(
  key: string,
  f: (value: Record<string, T>) => T | undefined,
  storage: Storage = getLocalStorage()
): T | undefined {
  const item = storage.getItem(key);

  if (item != null) {
    return f(JSON.parse(item));
  }
}
