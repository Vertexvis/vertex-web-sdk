import { Point, Vector3 } from '@vertexvis/geometry';

import { makePerspectiveFrame } from '../../../testing/fixtures';
import { Viewport } from '../../types';
import { testDrawable, testTriangleMesh } from '../hits';
import { AxisLine, AxisLinePoints } from '../line';
import { TriangleMesh, TriangleMeshPoints } from '../mesh';

describe(testDrawable, () => {
  const triangle = new TriangleMesh(
    jest.fn(),
    'x-translate',
    new TriangleMeshPoints(
      true,
      Vector3.origin(),
      Vector3.left(),
      Vector3.right(),
      Vector3.up(),
      Point.create(0, 0),
      Point.create(-1, 0),
      Point.create(1, 0),
      Point.create(0, 1)
    ),
    '#000000',
    '#000000'
  );
  const axis = new AxisLine(
    jest.fn(),
    'x-translate',
    new AxisLinePoints(
      true,
      Vector3.origin(),
      Vector3.left(),
      Point.create(0, 0),
      Point.create(-1, 0)
    ),
    '#000000',
    '#000000'
  );
  const frame = makePerspectiveFrame();
  const viewport = Viewport.fromDimensions(frame.image.imageAttr.imageRect);

  it('tests triangle meshes', () => {
    expect(
      testDrawable(
        triangle,
        frame,
        viewport,
        Point.create(viewport.width / 2, viewport.height / 2)
      )
    ).toBe(true);
  });

  it('returns false for any other drawable', () => {
    expect(
      testDrawable(
        axis,
        frame,
        viewport,
        Point.create(viewport.width / 2, viewport.height / 2)
      )
    ).toBe(false);
  });
});

describe(testTriangleMesh, () => {
  const mesh = new TriangleMesh(
    jest.fn(),
    'x-translate',
    new TriangleMeshPoints(
      true,
      Vector3.origin(),
      Vector3.left(),
      Vector3.right(),
      Vector3.up(),
      Point.create(0, 0),
      Point.create(-1, 0),
      Point.create(1, 0),
      Point.create(0, 1)
    ),
    '#000000',
    '#000000'
  );
  const frame = makePerspectiveFrame();
  const viewport = Viewport.fromDimensions(frame.image.imageAttr.imageRect);

  it('returns true if the point hits the mesh', () => {
    expect(
      testTriangleMesh(
        mesh,
        frame,
        viewport,
        Point.create(viewport.width / 2, viewport.height / 2)
      )
    ).toBe(true);
  });

  it('returns false if the point is perpendicular to the mesh', () => {
    const rightOfCamera = Vector3.add(
      frame.scene.camera.position,
      Vector3.create(100, 0, 0)
    );
    const meshRightOfCamera = new TriangleMesh(
      jest.fn(),
      'x-translate',
      new TriangleMeshPoints(
        true,
        rightOfCamera,
        Vector3.add(rightOfCamera, Vector3.forward()),
        Vector3.add(rightOfCamera, Vector3.back()),
        Vector3.add(rightOfCamera, Vector3.up()),
        Point.create(0, 0),
        Point.create(-1, 0),
        Point.create(1, 0),
        Point.create(0, 1)
      ),
      '#000000',
      '#000000'
    );

    expect(
      testTriangleMesh(
        meshRightOfCamera,
        frame,
        viewport,
        Point.create(viewport.width / 2, viewport.height / 2)
      )
    ).toBe(false);
  });

  it('returns false if the point is not on the mesh', () => {
    expect(
      testTriangleMesh(
        mesh,
        frame,
        viewport,
        Point.create(0, viewport.height / 2)
      )
    ).toBe(false);
  });
});
