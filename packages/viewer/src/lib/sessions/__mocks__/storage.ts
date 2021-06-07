const mockStorage: Record<string, any> = {};

export const upsertStorageEntry = jest.fn((key, values) => {
  mockStorage[key] =
    mockStorage[key] != null ? { ...mockStorage[key], ...values } : values;
});

export const getStorageEntry = jest.fn((key, f) => f(mockStorage[key]));
