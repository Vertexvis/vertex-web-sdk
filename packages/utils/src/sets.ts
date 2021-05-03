export function diffSet<T>(a: Set<T>, b: Set<T>): Set<T> {
  const res = new Set<T>();
  for (const item of b) {
    if (!a.has(item)) {
      res.add(item);
    }
  }
  return res;
}
