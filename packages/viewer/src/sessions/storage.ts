export function upsertStorageEntry<T>(
  key: string,
  values: Record<string, T>,
  storageLocation: Record<string, any> = window,
  storageKey: string = 'localStorage'
): void {
  const storage = storageLocation[storageKey];
  const existing = storage.getItem(key);

  if (existing != null) {
    const updated = {
      ...JSON.parse(existing),
      ...values,
    };

    storage.setItem(key, JSON.stringify(updated));
  } else {
    storage.setItem(key, JSON.stringify(values));
  }
}

export function getStorageEntry<T>(
  key: string,
  f: (value: Record<string, T>) => T | undefined,
  storageLocation: Record<string, any> = window,
  storageKey: string = 'localStorage'
): T | undefined {
  const storage = storageLocation[storageKey];
  const item = storage.getItem(key);

  if (item != null) {
    return f(JSON.parse(item));
  }
}
