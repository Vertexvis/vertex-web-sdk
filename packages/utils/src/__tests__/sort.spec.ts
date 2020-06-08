import * as Sort from '../sort';

const strs = ['a', 'd', 'b', 'c'];
const nums = [1, 4, 2, 3];

describe(Sort.asc, () => {
  it('sorts numbers in ascending order', () => {
    const result = nums.concat().sort(Sort.asc);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('sorts strings in ascending order', () => {
    const result = strs.concat().sort(Sort.asc);
    expect(result).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe(Sort.desc, () => {
  it('sorts numbers in descending order', () => {
    const result = nums.concat().sort(Sort.desc);
    expect(result).toEqual([4, 3, 2, 1]);
  });

  it('sorts strings in descending order', () => {
    const result = strs.concat().sort(Sort.desc);
    expect(result).toEqual(['d', 'c', 'b', 'a']);
  });
});

describe(Sort.head, () => {
  const subject = [
    ['a', 1],
    ['c', 3],
    ['b', 2],
  ];

  it('sorts by the head element in an array', () => {
    const result = subject.concat().sort(Sort.head(Sort.asc));
    expect(result).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
  });
});
