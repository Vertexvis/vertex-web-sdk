import { clamp, lerp } from '../math';

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

describe(lerp, () => {
  it('interpolates between A and B', () => {
    expect(lerp(1, 2, 0.5)).toEqual(1.5);
  });

  it('clamps to 0', () => {
    expect(lerp(1, 2, -1)).toEqual(1);
  });

  it('clamps to 1', () => {
    expect(lerp(1, 2, 2)).toEqual(2);
  });
});
