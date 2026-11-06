import { Vector3 } from '@vertexvis/geometry';

import { Orientation } from '../orientation';

describe(Orientation, () => {
  it('isLeftHanded should handle a left-handed orientation', () => {
    const upVector = Vector3.create(1, 0, 0);
    const frontVector = Vector3.create(0, -1, 0);
    const rightVector = Vector3.create(0, 0, 1);

    const leftHandedOrientation = new Orientation(
      upVector,
      frontVector,
      rightVector,
    );

    expect(leftHandedOrientation.isLeftHanded).toEqual(true);
  });

  it('isLeftHanded should handle a right-handed orientation', () => {
    const upVector = Vector3.create(1, 0, 0);
    const frontVector = Vector3.create(0, -1, 0);
    const rightVector = Vector3.create(0, 0, -1);

    const rightHandedOrientation = new Orientation(
      upVector,
      frontVector,
      rightVector,
    );

    expect(rightHandedOrientation.isLeftHanded).toEqual(false);
  });
});
