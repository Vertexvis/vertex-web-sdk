import * as BoundingBox from '../boundingBox';
import * as BoundingSphere from '../boundingSphere';
import * as Vector3 from '../vector3';

describe(BoundingSphere.create, () => {
  it('creates a bounding sphere with correct radius', () => {
    const boundingBox = BoundingBox.create(
      Vector3.create(-2, -2, -2),
      Vector3.create(10, 10, 10)
    );
    const boundingSphere = BoundingSphere.create(boundingBox);

    expect(boundingSphere.radius).toBe(Math.sqrt(108));
    expect(boundingSphere.center).toMatchObject(Vector3.create(4, 4, 4));
  });
});
