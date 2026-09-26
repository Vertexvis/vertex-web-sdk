const mockStorage: Record<string, any> = {};

export const upsertStorageEntry = vi.fn((key, values) => {
  mockStorage[key] =
    mockStorage[key] != null ? { ...mockStorage[key], ...values } : values;
});

export const getStorageEntry = vi.fn((key, f) => f(mockStorage[key]));
