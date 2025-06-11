jest.mock('regl-shape');
jest.mock('regl');

import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import { axisPositions } from '../../../../lib/transforms/axis-lines';
import { computeArrowNdcValues } from '../../../../lib/transforms/axis-translation';
import { AxisLine } from '../../../../lib/transforms/line';
import { Mesh, TriangleMesh } from '../../../../lib/transforms/mesh';
import {
  Frame,
  FrameCameraBase,
  FrameOrthographicCamera,
  FrameScene,
} from '../../../../lib/types';
import {
  DEFAULT_ORTHOGRAPHIC_MESH_SCALAR,
  DEFAULT_PERSPECTIVE_MESH_SCALAR,
} from '../../../../lib/webgl/regl-component';
import {
  makeDepthImagePng,
  makeFeatureMapBytes,
  makeOrthographicFrame,
  makePerspectiveFrame,
} from '../../../../testing/fixtures';
import { createdPaddedFloat64Array } from '../../../../testing/webgl';
import {
  DEFAULT_PLANE_SIZE_SCALAR,
  DEFAULT_POINT_SIZE_SCALAR,
  HitIndicator,
} from '../indicator';
import { computePlaneNdcValues } from '../plane';
import { computePointNdcValues } from '../point';

type MockShapeBuilder = jest.Mock<{ createShape: jest.Mock }>;

const mockShapeBuilder = shapeBuilder as MockShapeBuilder;

function createMeshes(
  transform: Matrix4.Matrix4,
  normal: Vector3.Vector3,
  frame: Frame,
  triangleSize?: number
): {
  arrow: TriangleMesh;
  axis: AxisLine;
  plane: Mesh;
  point: Mesh;
} {
  const expectedTriangleSize =
    triangleSize ??
    Vector3.magnitude(
      Vector3.subtract(
        Vector3.fromMatrixPosition(transform),
        frame.scene.camera.position
      )
    ) * DEFAULT_PERSPECTIVE_MESH_SCALAR;

  const arrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'hit-normal-arrow',
    computeArrowNdcValues(
      transform,
      frame.scene.camera,
      normal,
      expectedTriangleSize
    ),
    '#000000',
    '#000000'
  );
  const axis = new AxisLine(
    mockShapeBuilder().createShape,
    'hit-normal-axis',
    axisPositions(transform, frame.scene.camera, arrow),
    '#000000',
    '#000000'
  );
  const plane = new Mesh(
    mockShapeBuilder().createShape,
    'hit-plane',
    computePlaneNdcValues(
      transform,
      frame.scene.camera,
      normal,
      expectedTriangleSize * DEFAULT_PLANE_SIZE_SCALAR
    ),
    '#000000',
    '#000000'
  );
  const point = new Mesh(
    mockShapeBuilder().createShape,
    'hit-position',
    computePointNdcValues(
      transform,
      frame.scene.camera,
      normal,
      expectedTriangleSize * DEFAULT_POINT_SIZE_SCALAR
    ),
    '#000000',
    '#000000'
  );
  return {
    arrow,
    axis,
    plane,
    point,
  };
}

function updateFrameCameraPosition(
  baseFrame: Frame,
  position: Vector3.Vector3
): Frame {
  return new Frame(
    baseFrame.correlationIds,
    baseFrame.temporalRefinementCorrelationId,
    baseFrame.sequenceNumber,
    baseFrame.dimensions,
    baseFrame.image,
    new FrameScene(
      new FrameCameraBase(
        position,
        baseFrame.scene.camera.lookAt,
        baseFrame.scene.camera.up,
        baseFrame.scene.camera.near,
        baseFrame.scene.camera.far,
        baseFrame.scene.camera.aspectRatio
      ),
      baseFrame.scene.boundingBox,
      baseFrame.scene.crossSection,
      baseFrame.scene.worldOrientation,
      baseFrame.scene.hasChanged
    ),
    makeDepthImagePng(100, 50),
    makeFeatureMapBytes(100, 50, (pt) => Color.create(0, 0, 0))
  );
}

describe(HitIndicator, () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  canvas.height = 900;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('begins drawing when a transform and normal are provided after a frame', async () => {
    const indicator = new HitIndicator(canvas);

    indicator.updateFrame(makePerspectiveFrame());
    indicator.updateTransformAndNormal(
      Matrix4.makeTranslation(Vector3.create(1, 1, 1)),
      Vector3.up()
    );

    expect(regl).toHaveBeenCalledWith(
      expect.objectContaining({
        canvas,
        extensions: 'angle_instanced_arrays',
      })
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalled();
    expect(regl().frame).toHaveBeenCalled();
  });

  it('begins drawing when a frame is provided after a transform and normal', async () => {
    const indicator = new HitIndicator(canvas);

    indicator.updateTransformAndNormal(
      Matrix4.makeTranslation(Vector3.create(1, 1, 1)),
      Vector3.up()
    );
    indicator.updateFrame(makePerspectiveFrame());

    expect(regl).toHaveBeenCalledWith(
      expect.objectContaining({
        canvas,
        extensions: 'angle_instanced_arrays',
      })
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalled();
    expect(regl().frame).toHaveBeenCalled();
  });

  it('creates meshes for the hit position, normal, and plane', async () => {
    const indicator = new HitIndicator(canvas);
    const frame = makePerspectiveFrame();
    const hithitPositionTransform = Matrix4.makeTranslation(
      Vector3.create(1, 1, 1)
    );
    const hitNormal = Vector3.up();
    const meshes = createMeshes(hithitPositionTransform, hitNormal, frame);

    mockShapeBuilder().createShape.mockClear();
    indicator.updateFrame(frame);
    indicator.updateTransformAndNormal(hithitPositionTransform, hitNormal);

    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      createdPaddedFloat64Array(meshes.arrow.points),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      createdPaddedFloat64Array(meshes.axis.points),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      createdPaddedFloat64Array(meshes.plane.points),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      createdPaddedFloat64Array(meshes.point.points),
      expect.anything()
    );
  });

  it('creates meshes for the hit position, normal, and plane with an orthographic camera', async () => {
    const indicator = new HitIndicator(canvas);
    const frame = makeOrthographicFrame();
    const hitPositionTransform = Matrix4.makeTranslation(
      Vector3.create(1, 1, 1)
    );
    const hitNormal = Vector3.up();
    const meshes = createMeshes(
      hitPositionTransform,
      hitNormal,
      frame,
      (frame.scene.camera as FrameOrthographicCamera).fovHeight *
        DEFAULT_ORTHOGRAPHIC_MESH_SCALAR
    );

    mockShapeBuilder().createShape.mockClear();
    indicator.updateFrame(frame);
    indicator.updateTransformAndNormal(hitPositionTransform, hitNormal);

    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      createdPaddedFloat64Array(meshes.arrow.points),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      createdPaddedFloat64Array(meshes.axis.points),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      createdPaddedFloat64Array(meshes.plane.points),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      createdPaddedFloat64Array(meshes.point.points),
      expect.anything()
    );
  });

  it('sorts the meshes', async () => {
    const indicator = new HitIndicator(canvas);
    const baseFrame = makePerspectiveFrame();
    const frameAbovePlane = updateFrameCameraPosition(
      baseFrame,
      Vector3.create(100, 200, 0)
    );
    const frameBelowPlane = updateFrameCameraPosition(
      baseFrame,
      Vector3.create(100, 0, 0)
    );

    const hitPositionTransform = Matrix4.makeTranslation(
      Vector3.create(100, 100, 100)
    );
    const hitNormal = Vector3.up();

    indicator.updateFrame(frameAbovePlane);
    indicator.updateTransformAndNormal(hitPositionTransform, hitNormal);

    expect(
      indicator.getDrawableElements().map((e) => e.identifier)
    ).toMatchObject(
      [
        'hit-normal-arrow',
        'hit-normal-axis',
        'hit-position',
        'hit-plane',
      ].reverse()
    );

    indicator.updateFrame(frameBelowPlane);

    expect(
      indicator.getDrawableElements().map((e) => e.identifier)
    ).toMatchObject(
      [
        'hit-position',
        'hit-plane',
        'hit-normal-axis',
        'hit-normal-arrow',
      ].reverse()
    );
  });

  it('updates with the colors provided, and retains existing if undefined', async () => {
    const indicator = new HitIndicator(canvas, {
      arrow: '#555555',
    });
    const frame = makePerspectiveFrame();
    const hitPositionTransform = Matrix4.makeTranslation(
      Vector3.create(1, 1, 1)
    );
    const hitNormal = Vector3.up();

    indicator.updateFrame(
      updateFrameCameraPosition(frame, Vector3.create(100, 100, 100))
    );
    indicator.updateTransformAndNormal(hitPositionTransform, hitNormal);

    indicator.updateColors({
      plane: '#333333',
      arrow: undefined,
    });

    expect(
      indicator
        .getDrawableElements()
        .some((e) => e.identifier === 'hit-plane' && e.fillColor === '#333333')
    ).toBe(true);
    expect(
      indicator
        .getDrawableElements()
        .some(
          (e) =>
            e.identifier === 'hit-normal-arrow' && e.fillColor === '#555555'
        )
    ).toBe(true);

    indicator.updateColors({
      plane: undefined,
      arrow: '#111111',
    });

    expect(
      indicator
        .getDrawableElements()
        .some((e) => e.identifier === 'hit-plane' && e.fillColor === '#333333')
    ).toBe(true);
    expect(
      indicator
        .getDrawableElements()
        .some(
          (e) =>
            e.identifier === 'hit-normal-arrow' && e.fillColor === '#111111'
        )
    ).toBe(true);
  });

  it('updates with the outline color provided', async () => {
    const indicator = new HitIndicator(canvas, {
      outline: '#555555',
    });
    const frame = makePerspectiveFrame();
    const hitPositionTransform = Matrix4.makeTranslation(
      Vector3.create(1, 1, 1)
    );
    const hitNormal = Vector3.up();

    indicator.updateFrame(
      updateFrameCameraPosition(frame, Vector3.create(100, 100, 100))
    );
    indicator.updateTransformAndNormal(hitPositionTransform, hitNormal);

    indicator.updateColors({
      outline: '#333333',
    });

    expect(
      indicator.getDrawableElements().every((e) => e.outlineColor === '#333333')
    ).toBe(true);
  });
});
