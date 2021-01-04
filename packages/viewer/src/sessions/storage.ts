export function upsertStorageEntry<T>(
  key: string,
  values: Record<string, T>,
  storageProvider?: () => Storage
): void {
  const storage =
    storageProvider != null ? storageProvider() : window.localStorage;
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
  storageProvider?: () => Storage
): T | undefined {
  const storage =
    storageProvider != null ? storageProvider() : window.localStorage;
  const item = storage.getItem(key);

  if (item != null) {
    return f(JSON.parse(item));
  }
}
