import * as Range from '../range';

describe(Range.create, () => {
  it('returns a range with start and end', () => {
    const range = Range.create(10, 20);
    expect(range).toMatchObject({ start: 10, end: 20 });
  });
});

describe(Range.withLength, () => {
  it('returns a range with length', () => {
    expect(Range.withLength(10, 10)).toEqual(Range.create(10, 19));
  });
});

describe(Range.at, () => {
  it('returns a range at the given position', () => {
    expect(Range.at(1)).toEqual(Range.create(1, 1));
  });
});

describe(Range.contains, () => {
  const range = Range.create(10, 20);

  it('returns true if number is within range', () => {
    expect(Range.contains(10, range)).toEqual(true);
  });

  it('returns false if number is outside range', () => {
    expect(Range.contains(9, range)).toEqual(false);
    expect(Range.contains(21, range)).toEqual(false);
  });

  it('returns true if range is within a range', () => {
    expect(Range.contains(range, range)).toEqual(true);
  });
});

describe(Range.add, () => {
  const range = Range.create(10, 20);

  it('should add the distance to the given range', () => {
    expect(Range.add(10, range)).toEqual(Range.create(20, 30));
  });
});

describe(Range.constrain, () => {
  const range = Range.create(10, 20);

  it('returns input if contained in `to`', () => {
    expect(Range.constrain(Range.create(11, 19), range)).toEqual(
      Range.create(11, 19)
    );
  });

  it('returns `to` range if input is larger', () => {
    expect(Range.constrain(Range.create(9, 21), range)).toEqual(range);
  });

  it('returns `to`s start if input is before `to`', () => {
    expect(Range.constrain(Range.create(9, 14), range)).toEqual(
      Range.create(10, 15)
    );
  });

  it('returns `to`s end if input is after `to`', () => {
    expect(Range.constrain(Range.create(19, 24), range)).toEqual(
      Range.create(15, 20)
    );
  });
});

describe(Range.intersection, () => {
  const range = Range.create(1, 3);

  it('returns the range that intersects two ranges', () => {
    const other = Range.create(0, 2);
    expect(Range.intersection(other, range)).toEqual(Range.create(1, 2));
  });

  it('returns undefined if two ranges do not intersect', () => {
    const other = Range.create(4, 5);
    expect(Range.intersection(other, range)).toBeUndefined();
  });

  it('returns the intersection when range contains other range', () => {
    const other = Range.create(2, 2);
    expect(Range.intersection(other, range)).toEqual(Range.create(2, 2));
    expect(Range.intersection(range, other)).toEqual(Range.create(2, 2));
  });
});

describe(Range.intersects, () => {
  const range = Range.create(1, 3);

  it('returns true if two ranges intersect', () => {
    const other = Range.create(0, 2);
    expect(Range.intersects(other, range)).toEqual(true);
  });

  it('returns true when range contains other range', () => {
    const other = Range.create(2, 2);
    expect(Range.intersects(other, range)).toEqual(true);
    expect(Range.intersects(range, other)).toEqual(true);
  });
});

describe(Range.isAt, () => {
  it('returns true if `other` starts at `range`', () => {
    const other = Range.create(1, 2);
    const range = Range.create(1, 3);
    expect(Range.isAt(other, range)).toEqual(true);
  });
});

describe(Range.isBefore, () => {
  it('returns true if `other` starts before `range`', () => {
    const other = Range.create(1, 2);
    const range = Range.create(2, 3);
    expect(Range.isBefore(other, range)).toEqual(true);
  });
});

describe(Range.isAtOrBefore, () => {
  it('returns true if `other` starts at `range`', () => {
    const other = Range.create(1, 2);
    const range = Range.create(1, 3);
    expect(Range.isAtOrBefore(other, range)).toEqual(true);
  });

  it('returns true if `other` is before `range`', () => {
    const other = Range.create(1, 2);
    const range = Range.create(2, 3);
    expect(Range.isAtOrBefore(other, range)).toEqual(true);
  });
});

describe(Range.isAtOrAfter, () => {
  it('returns true if `other` starts at `range`', () => {
    const other = Range.create(1, 2);
    const range = Range.create(1, 3);
    expect(Range.isAtOrAfter(other, range)).toEqual(true);
  });

  it('returns true if `other` is after `range`', () => {
    const other = Range.create(2, 3);
    const range = Range.create(1, 2);
    expect(Range.isAtOrAfter(other, range)).toEqual(true);
  });
});

describe(Range.isAtOrAfter, () => {
  it('returns true if `other` starts after `range`', () => {
    const other = Range.create(3, 4);
    const range = Range.create(1, 2);
    expect(Range.isAfter(other, range)).toEqual(true);
  });
});

describe(Range.length, () => {
  it('returns the inclusive length from start to end', () => {
    expect(Range.length(Range.withLength(0, 10))).toEqual(10);
  });
});

describe(Range.subtract, () => {
  const range = Range.create(10, 20);

  it('should add the distance to the given range', () => {
    expect(Range.subtract(10, range)).toEqual(Range.create(0, 10));
  });
});

describe(Range.truncate, () => {
  const range = Range.create(10, 20);

  it('returns range with start and end adjusted to other range', () => {
    expect(Range.truncate(Range.create(0, 30), range)).toEqual(range);
  });

  it('returns undefined if ranges do not intersect', () => {
    expect(Range.truncate(Range.at(0), range)).toBeUndefined();
  });
});
