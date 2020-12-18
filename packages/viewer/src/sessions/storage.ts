export function upsertStorageEntry<T>(
  key: string,
  values: Record<string, T>,
  storage: Storage = window.localStorage
): void {
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
  storage: Storage = window.localStorage
): T | undefined {
  const item = storage.getItem(key);

  if (item != null) {
    return f(JSON.parse(item));
  }
}
