import { BoundingBox, BoundingSphere, Vector3 } from '@vertexvis/geometry';

import { constrainViewVector } from '../vectors';

describe(constrainViewVector, () => {
  it('scales up the provided view vector to the radius of the provided bounding sphere', () => {
    const viewVector = Vector3.back();
    const boundingSphere = BoundingSphere.create(
      BoundingBox.create(
        Vector3.create(-100, -100, -100),
        Vector3.create(100, 100, 100)
      )
    );

    expect(constrainViewVector(viewVector, boundingSphere)).toMatchObject({
      x: 0,
      y: 0,
      z: Math.sqrt(30000),
    });
  });

  it('scales down the provided view vector to the radius of the provided bounding sphere', () => {
    const viewVector = Vector3.scale(1000, Vector3.back());
    const boundingSphere = BoundingSphere.create(
      BoundingBox.create(
        Vector3.create(-100, -100, -100),
        Vector3.create(100, 100, 100)
      )
    );

    expect(constrainViewVector(viewVector, boundingSphere)).toMatchObject({
      x: 0,
      y: 0,
      z: Math.sqrt(30000),
    });
  });
});
