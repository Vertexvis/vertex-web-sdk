import * as Point from '../point';
import * as Rectangle from '../rectangle';

describe(Rectangle.fromPoints, () => {
  it('returns rectangle with positive width and height', () => {
    const a = Point.create(0, 0);
    const b = Point.create(-50, -25);
    expect(Rectangle.fromPoints(a, b)).toEqual({
      x: -50,
      y: -25,
      width: 50,
      height: 25,
    });
  });
});

describe(Rectangle.containFit, () => {
  const a = Rectangle.create(100, 100, 100, 100);
  const b = Rectangle.create(0, 0, 400, 200);

  it('scales down rectangle to fit into another rectangle', () => {
    const fit = Rectangle.containFit(a, b);
    expect(fit).toMatchObject({
      x: 100,
      y: 125,
      width: 100,
      height: 50,
    });
  });
});

describe(Rectangle.cropFit, () => {
  const a = Rectangle.create(100, 100, 100, 100);
  const b = Rectangle.create(0, 0, 400, 200);

  it('scales down rectangle to crop into another rectangle', () => {
    const fit = Rectangle.cropFit(a, b);
    expect(fit).toMatchObject({
      x: 50,
      y: 100,
      width: 200,
      height: 100,
    });
  });
});

describe(Rectangle.scaleFit, () => {
  const rect1 = Rectangle.create(100, 100, 100, 100);
  const rect2 = Rectangle.create(100, 100, 100, 125);

  it('scales the rectangle to have an area less than or equal to the provided area', () => {
    expect(Rectangle.scaleFit(2500, rect1)).toEqual(
      Rectangle.create(125, 125, 50, 50)
    );

    expect(Rectangle.scaleFit(2500, rect2)).toEqual(
      Rectangle.create(128, 135, 44, 55)
    );
  });
});

describe(Rectangle.scale, () => {
  const rect = Rectangle.create(100, 200, 300, 400);

  it('scales a rectangle uniformly', () => {
    const scaled = Rectangle.scale(rect, 2);
    expect(scaled).toEqual(Rectangle.create(200, 400, 600, 800));
  });

  it('scales a rectangle by x and y scale factors', () => {
    const scaled = Rectangle.scale(rect, 2, 3);
    expect(scaled).toEqual(Rectangle.create(200, 600, 600, 1200));
  });
});

describe(Rectangle.offset, () => {
  const rect = Rectangle.create(10, 20, 30, 30);

  it('should move the rectangle', () => {
    expect(Rectangle.offset(Point.create(-10, -20), rect)).toEqual({
      x: 0,
      y: 0,
      width: 30,
      height: 30,
    });
  });
});

describe(Rectangle.center, () => {
  it('returns the center point of a rectangle', () => {
    const rect = Rectangle.create(10, 10, 10, 10);
    expect(Rectangle.center(rect)).toMatchObject({
      x: 15,
      y: 15,
    });
  });
});

describe(Rectangle.isLandscape, () => {
  it('returns true if the rectangle is landscape', () => {
    const rect = Rectangle.create(0, 0, 10, 5);
    expect(Rectangle.isLandscape(rect)).toEqual(true);
  });
});

describe(Rectangle.isPortrait, () => {
  it('returns true if the rectangle is landscape', () => {
    const rect = Rectangle.create(0, 0, 5, 10);
    expect(Rectangle.isPortrait(rect)).toEqual(true);
  });
});

describe(Rectangle.isSquare, () => {
  it('returns true if the rectangle is square', () => {
    const rect = Rectangle.create(0, 0, 5, 5);
    expect(Rectangle.isSquare(rect)).toEqual(true);
  });
});

describe(Rectangle.isEqual, () => {
  it('returns true if two rectangles have the same components', () => {
    const a = Rectangle.create(0, 0, 5, 5);
    const b = Rectangle.create(0, 0, 5, 5);
    expect(Rectangle.isEqual(a, b)).toEqual(true);
  });

  it('returns false if two rectangles do not have the same components', () => {
    const a = Rectangle.create(0, 0, 5, 5);
    const b = Rectangle.offset(Point.create(1, 1), a);
    expect(Rectangle.isEqual(a, b)).toEqual(false);
  });
});

describe(Rectangle.bottomRight, () => {
  it('returns the bottom right point of a rectangle', () => {
    const rect = Rectangle.create(1, 2, 10, 20);
    const result = Rectangle.bottomRight(rect);
    expect(result).toEqual(Point.create(11, 22));
  });
});

describe(Rectangle.pad, () => {
  it('adds padding to the rectangle', () => {
    const rect = Rectangle.create(1, 1, 10, 10);
    const result = Rectangle.pad(rect, 1);
    expect(result).toEqual(Rectangle.create(0, 0, 12, 12));
  });
});

describe(Rectangle.containsPoints, () => {
  it('returns true if all the points are contained by the rectangle', () => {
    const rect = Rectangle.create(1, 1, 10, 10);
    expect(
      Rectangle.containsPoints(
        rect,
        Point.create(2, 2),
        Point.create(3, 3),
        Point.create(4, 4)
      )
    ).toBe(true);
  });

  it('returns false if any of the points are not contained by the rectangle', () => {
    const rect = Rectangle.create(1, 1, 10, 10);
    expect(
      Rectangle.containsPoints(
        rect,
        Point.create(2, 2),
        Point.create(3, 3),
        Point.create(15, 15)
      )
    ).toBe(false);
  });

  it('returns true if points lie on the bounds of the rectangle', () => {
    const rect = Rectangle.create(1, 1, 10, 10);
    expect(
      Rectangle.containsPoints(rect, Point.create(1, 1), Point.create(11, 11))
    ).toBe(true);
  });
});

describe(Rectangle.fromJson, () => {
  it('parses json obj', () => {
    const v = Rectangle.fromJson(
      JSON.stringify({ x: 1, y: 2, width: 10, height: 10 })
    );
    expect(v).toEqual(Rectangle.create(1, 2, 10, 10));
  });

  it('parses json array', () => {
    const v = Rectangle.fromJson('[1, 2, 10, 10]');
    expect(v).toEqual(Rectangle.create(1, 2, 10, 10));
  });
});
