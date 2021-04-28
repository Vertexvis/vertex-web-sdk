import { diffSet } from '../sets';

describe(diffSet, () => {
  it('returns items in B that are not in A', () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([3, 4, 5]);
    const diff = diffSet(a, b);
    expect(Array.from(diff)).toEqual([4, 5]);
  });
});
