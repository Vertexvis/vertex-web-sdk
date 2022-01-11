import * as BoundingBox from '../boundingBox';
import * as Vector3 from '../vector3';

describe(BoundingBox.create, () => {
  it('creates a bounding box', () => {
    const min = Vector3.create(1, 1, 0);
    const max = Vector3.create(-1, -1, 0);
    expect(BoundingBox.create(min, max)).toEqual({ min, max });
  });
});

describe(BoundingBox.center, () => {
  it('returns the center point of a bounding box', () => {
    const min = Vector3.create(1, 1, 0);
    const max = Vector3.create(-1, -1, 0);
    expect(BoundingBox.center(BoundingBox.create(min, max))).toEqual(
      Vector3.origin()
    );
  });
});

const bbox = BoundingBox.create(
  Vector3.create(10, 30, 30),
  Vector3.create(100, 300, 300)
);
const bbox2 = BoundingBox.create(
  Vector3.create(-20, -30, -40),
  Vector3.create(100, 200, 300)
);

const bbox3 = BoundingBox.create(
  Vector3.create(-1000, 200, 100),
  Vector3.create(-200, 400, 600)
);

describe(BoundingBox.union, () => {
  it('creates a bbox that contains both bboxes', () => {
    expect(BoundingBox.union(bbox2, bbox3)).toEqual(
      BoundingBox.create(
        Vector3.create(-1000, -30, -40),
        Vector3.create(100, 400, 600)
      )
    );
  });

  it('combines all bboxes', () => {
    expect(BoundingBox.union(bbox, bbox2, bbox3)).toEqual(
      BoundingBox.create(
        Vector3.create(-1000, -30, -40),
        Vector3.create(100, 400, 600)
      )
    );
  });

  it('handles 1 bbox', () => {
    expect(BoundingBox.union(bbox3)).toEqual(bbox3);
  });

  it('returns undefined if no argument', () => {
    expect(BoundingBox.union()).toBeUndefined();
  });
});

describe(BoundingBox.fromVectors, () => {
  it('combines vectors to form a minimal boundingBox', () => {
    expect(
      BoundingBox.fromVectors([
        Vector3.create(-5, 100, 0),
        Vector3.create(100, -10, 2222),
        Vector3.create(101, 33, -2),
      ])
    ).toEqual(
      BoundingBox.create(
        Vector3.create(-5, -10, -2),
        Vector3.create(101, 100, 2222)
      )
    );
  });
});
