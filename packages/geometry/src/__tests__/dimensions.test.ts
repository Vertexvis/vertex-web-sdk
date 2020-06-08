import * as Dimensions from '../dimensions';
import * as Point from '../point';
import * as Rectangle from '../rectangle';

describe(Dimensions.create, () => {
  it('creates a dimension of the correct size', () => {
    expect(Dimensions.create(1, 2)).toEqual({ width: 1, height: 2 });
  });
});

describe(Dimensions.square, () => {
  it('creates a dimension of the same width and height', () => {
    expect(Dimensions.square(50)).toEqual({ width: 50, height: 50 });
  });
});

describe(Dimensions.isEqual, () => {
  it('returns true if dimension has same width and height', () => {
    expect(
      Dimensions.isEqual(Dimensions.square(50), Dimensions.square(50))
    ).toEqual(true);
  });
});

describe(Dimensions.scale, () => {
  it('multiples width and height by scale factors', () => {
    const d = Dimensions.create(10, 10);
    expect(Dimensions.scale(2, 4, d)).toEqual(Dimensions.create(20, 40));
  });
});

describe(Dimensions.proportionalScale, () => {
  it('scales width and height with the same scale factor', () => {
    const d = Dimensions.create(10, 20);
    expect(Dimensions.proportionalScale(2, d)).toEqual(
      Dimensions.create(20, 40)
    );
  });
});

describe(Dimensions.trim, () => {
  it('returns the min length of each dimension', () => {
    const a = Dimensions.create(50, 100);
    const b = Dimensions.create(200, 400);
    expect(Dimensions.trim(a, b)).toEqual(a);
  });
});

describe(Dimensions.containFit, () => {
  it('returns a dimension that is min fit to another dimension', () => {
    const a = Dimensions.create(50, 100);
    const b = Dimensions.create(200, 200);
    expect(Dimensions.containFit(a, b)).toEqual(Dimensions.create(50, 50));
  });
});

describe(Dimensions.cropFit, () => {
  it('returns a dimension that is max fit to another dimension', () => {
    const a = Dimensions.create(50, 100);
    const b = Dimensions.create(400, 200);
    expect(Dimensions.cropFit(a, b)).toEqual(Dimensions.create(200, 100));
  });
});

describe(Dimensions.round, () => {
  it('returns a dimension with each length rounded', () => {
    expect(Dimensions.round(Dimensions.create(10.7, 10.1))).toEqual(
      Dimensions.create(11, 10)
    );
  });
});

describe(Dimensions.center, () => {
  it('returns the center point', () => {
    expect(Dimensions.center(Dimensions.create(100, 50))).toEqual(
      Point.create(50, 25)
    );
  });
});

describe(Dimensions.aspectRatio, () => {
  it('returns the width / height', () => {
    expect(Dimensions.aspectRatio(Dimensions.create(10, 5))).toEqual(2);
  });
});

describe(Dimensions.fitToRatio, () => {
  it('returns a dimensions with adjusted width or height to fit the aspect ratio', () => {
    const dimensions = Dimensions.create(500, 400);

    expect(Dimensions.fitToRatio(2, dimensions)).toMatchObject(
      Dimensions.create(500, 250)
    );
    expect(Dimensions.fitToRatio(1 / 2, dimensions)).toMatchObject(
      Dimensions.create(200, 400)
    );
  });
});

describe(Dimensions.toRectangle, () => {
  it('converts a dimension to a rectangle', () => {
    const rect = Dimensions.toRectangle(
      Dimensions.create(100, 50),
      Point.create(10, 10)
    );
    expect(rect).toEqual(Rectangle.create(10, 10, 100, 50));
  });
});
