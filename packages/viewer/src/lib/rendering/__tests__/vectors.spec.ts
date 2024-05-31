import { BoundingBox, BoundingSphere, Vector3 } from '@vertexvis/geometry';

import {
  constrainViewVector,
  updateLookAtRelativeToBoundingBoxCenter,
} from '../vectors';

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

describe(updateLookAtRelativeToBoundingBoxCenter, () => {
  it('updates the lookAt point relative to the provided view vector and center point', () => {
    const originalLookAt = Vector3.create(1, 2, 3);
    const viewVector = Vector3.create(5, 5, 5);
    const boundingSphereCenter = Vector3.create(0, 0, 0);

    expect(
      updateLookAtRelativeToBoundingBoxCenter(
        originalLookAt,
        viewVector,
        boundingSphereCenter
      )
    ).toMatchObject({
      x: -1,
      y: 0,
      z: 1,
    });
  });
});
