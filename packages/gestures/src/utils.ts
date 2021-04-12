export function diffSet<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const value of a.values()) {
    if (!b.has(value)) {
      result.add(value);
    }
  }
  return result;
}
