import { clamp } from '../util';

describe(clamp, () => {
  it('clamps to min', () => {
    expect(clamp(0, 1, 2)).toEqual(1);
  });

  it('clamps to max', () => {
    expect(clamp(3, 1, 2)).toEqual(2);
  });

  it('returns value if between min and max', () => {
    expect(clamp(2, 1, 3)).toEqual(2);
  });
});
