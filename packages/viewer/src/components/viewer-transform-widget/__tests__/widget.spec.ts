jest.mock('regl-shape');
jest.mock('regl');
jest.mock('../../../lib/transforms/hits', () => ({
  testDrawable: jest.fn(),
}));

import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import { axisPositions } from '../../../lib/transforms/axis-lines';
import {
  xAxisArrowPositions,
  yAxisArrowPositions,
  zAxisArrowPositions,
} from '../../../lib/transforms/axis-translation';
import { testDrawable } from '../../../lib/transforms/hits';
import { AxisLine } from '../../../lib/transforms/line';
import { TriangleMesh } from '../../../lib/transforms/mesh';
import { flattenPointArray } from '../../../lib/transforms/util';
import {
  Frame,
  FrameCameraBase,
  FrameOrthographicCamera,
  FrameScene,
} from '../../../lib/types';
import {
  makeDepthImagePng,
  makeFeatureMapBytes,
  makeOrthographicFrame,
  makePerspectiveFrame,
} from '../../../testing/fixtures';
import {
  DEFAULT_ORTHOGRAPHIC_MESH_SCALAR,
  DEFAULT_PERSPECTIVE_MESH_SCALAR,
  TransformWidget,
} from '../widget';

type MockShapeBuilder = jest.Mock<{ createShape: jest.Mock }>;

const mockShapeBuilder = shapeBuilder as MockShapeBuilder;

function createMeshes(
  transform: Matrix4.Matrix4,
  frame: Frame,
  triangleSize?: number
): {
  xArrow: TriangleMesh;
  yArrow: TriangleMesh;
  zArrow: TriangleMesh;
  xAxis: AxisLine;
  yAxis: AxisLine;
  zAxis: AxisLine;
} {
  const expectedTriangleSize =
    triangleSize ??
    Vector3.magnitude(
      Vector3.subtract(
        Vector3.fromMatrixPosition(transform),
        frame.scene.camera.position
      )
    ) * DEFAULT_PERSPECTIVE_MESH_SCALAR;

  const xArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'x-translate',
    xAxisArrowPositions(transform, frame.scene.camera, expectedTriangleSize),
    '#000000',
    '#000000'
  );
  const xAxis = new AxisLine(
    mockShapeBuilder().createShape,
    'x-axis',
    axisPositions(transform, frame.scene.camera, xArrow),
    '#000000',
    '#000000'
  );
  const yArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'y-translate',
    yAxisArrowPositions(transform, frame.scene.camera, expectedTriangleSize),
    '#000000',
    '#000000'
  );
  const yAxis = new AxisLine(
    mockShapeBuilder().createShape,
    'y-axis',
    axisPositions(transform, frame.scene.camera, yArrow),
    '#000000',
    '#000000'
  );
  const zArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'z-translate',
    zAxisArrowPositions(transform, frame.scene.camera, expectedTriangleSize),
    '#000000',
    '#000000'
  );
  const zAxis = new AxisLine(
    mockShapeBuilder().createShape,
    'z-axis',
    axisPositions(transform, frame.scene.camera, zArrow),
    '#000000',
    '#000000'
  );

  return {
    xArrow,
    yArrow,
    zArrow,
    xAxis,
    yAxis,
    zAxis,
  };
}

function updateFrameCameraPosition(
  baseFrame: Frame,
  position: Vector3.Vector3
): Frame {
  return new Frame(
    baseFrame.correlationIds,
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

describe(TransformWidget, () => {
  const canvas = document.createElement('canvas');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('begins drawing when a position and frame are provided', async () => {
    const widget = new TransformWidget(canvas);

    widget.updateFrame(makePerspectiveFrame());
    widget.updateTransform(Matrix4.makeTranslation(Vector3.create(1, 1, 1)));

    expect(regl).toHaveBeenCalledWith(
      expect.objectContaining({
        canvas,
        extensions: 'angle_instanced_arrays',
      })
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalled();
    expect(regl().frame).toHaveBeenCalled();
  });

  it('creates axis and arrow meshes', async () => {
    const widget = new TransformWidget(canvas);
    const frame = makePerspectiveFrame();
    const positionTransform = Matrix4.makeTranslation(Vector3.create(1, 1, 1));
    const meshes = createMeshes(positionTransform, frame);

    mockShapeBuilder().createShape.mockClear();
    widget.updateFrame(frame);
    widget.updateTransform(positionTransform);

    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.xArrow.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.yArrow.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.zArrow.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.xAxis.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.yAxis.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.zAxis.points.toArray())),
      expect.anything()
    );
  });

  it('creates axis and arrow meshes for orthographic cameras', async () => {
    const widget = new TransformWidget(canvas);
    const frame = makeOrthographicFrame();
    const positionTransform = Matrix4.makeTranslation(Vector3.create(1, 1, 1));
    const meshes = createMeshes(
      positionTransform,
      frame,
      (frame.scene.camera as FrameOrthographicCamera).fovHeight *
        DEFAULT_ORTHOGRAPHIC_MESH_SCALAR
    );

    mockShapeBuilder().createShape.mockClear();
    widget.updateFrame(frame);
    widget.updateTransform(positionTransform);

    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.xArrow.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.yArrow.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.zArrow.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.xAxis.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.yAxis.points.toArray())),
      expect.anything()
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalledWith(
      new Float64Array(flattenPointArray(meshes.zAxis.points.toArray())),
      expect.anything()
    );
  });

  it('sorts the meshes', async () => {
    const widget = new TransformWidget(canvas);
    const baseFrame = makePerspectiveFrame();
    const xFrame = updateFrameCameraPosition(
      baseFrame,
      Vector3.create(100, 10, 0)
    );
    const yFrame = updateFrameCameraPosition(
      baseFrame,
      Vector3.create(0, 100, 10)
    );
    const zFrame = updateFrameCameraPosition(
      baseFrame,
      Vector3.create(10, 0, 100)
    );

    const positionTransform = Matrix4.makeTranslation(Vector3.create(1, 1, 1));

    widget.updateFrame(xFrame);
    widget.updateTransform(positionTransform);

    expect(widget.getDrawableElements().map((e) => e.identifier)).toMatchObject(
      [
        'x-translate',
        'zx-rotation-line',
        'z-rotate',
        'yx-rotation-line',
        'y-rotate',
        'zy-rotation-line',
        'x-axis',
        'yz-rotation-line',
        'y-translate',
        'y-axis',
        'xy-rotation-line',
        'x-rotate',
        'xz-rotation-line',
        'z-axis',
        'z-translate',
      ].reverse()
    );

    widget.updateFrame(yFrame);

    expect(widget.getDrawableElements().map((e) => e.identifier)).toMatchObject(
      [
        'y-translate',
        'xy-rotation-line',
        'x-rotate',
        'zy-rotation-line',
        'z-rotate',
        'xz-rotation-line',
        'y-axis',
        'zx-rotation-line',
        'z-translate',
        'z-axis',
        'yz-rotation-line',
        'y-rotate',
        'yx-rotation-line',
        'x-axis',
        'x-translate',
      ].reverse()
    );

    widget.updateFrame(zFrame);

    expect(widget.getDrawableElements().map((e) => e.identifier)).toMatchObject(
      [
        'z-translate',
        'yz-rotation-line',
        'y-rotate',
        'xz-rotation-line',
        'x-rotate',
        'yx-rotation-line',
        'z-axis',
        'xy-rotation-line',
        'x-translate',
        'x-axis',
        'zx-rotation-line',
        'z-rotate',
        'zy-rotation-line',
        'y-axis',
        'y-translate',
      ].reverse()
    );
  });

  it('updates and clears the hovered mesh', async () => {
    const widget = new TransformWidget(canvas, {
      hovered: '#ffff00',
    });
    const frame = makePerspectiveFrame();
    const positionTransform = Matrix4.makeTranslation(Vector3.create(1, 1, 1));
    const meshes = createMeshes(positionTransform, frame);
    const hoveredListener = jest.fn();

    (testDrawable as jest.Mock).mockImplementation(
      (m) => m.identifier === 'x-translate'
    );

    widget.onHoveredChanged(hoveredListener);
    widget.updateFrame(frame);
    widget.updateTransform(positionTransform);
    widget.updateCursor(Point.create(100, 100));

    meshes.xArrow.updateFillColor('#ffff00');

    expect(hoveredListener).toHaveBeenCalledWith(meshes.xArrow);

    widget.updateCursor(undefined);

    expect(hoveredListener).toHaveBeenCalledWith(undefined);
  });

  it('updates with the colors provided, and retains existing if undefined', async () => {
    const widget = new TransformWidget(canvas, {
      zArrow: '#555555',
    });
    const frame = makePerspectiveFrame();
    const positionTransform = Matrix4.makeTranslation(Vector3.create(1, 1, 1));

    widget.updateFrame(
      updateFrameCameraPosition(frame, Vector3.create(100, 100, 100))
    );
    widget.updateTransform(positionTransform);

    widget.updateColors({
      xArrow: '#333333',
      yArrow: '#444444',
      zArrow: undefined,
    });

    expect(
      widget.getDrawableElements().some((e) => e.fillColor === '#333333')
    ).toBe(true);
    expect(
      widget.getDrawableElements().some((e) => e.fillColor === '#444444')
    ).toBe(true);
    expect(
      widget.getDrawableElements().some((e) => e.fillColor === '#555555')
    ).toBe(true);

    widget.updateColors({
      xArrow: undefined,
      yArrow: undefined,
      zArrow: '#111111',
    });

    expect(
      widget.getDrawableElements().some((e) => e.fillColor === '#333333')
    ).toBe(true);
    expect(
      widget.getDrawableElements().some((e) => e.fillColor === '#444444')
    ).toBe(true);
    expect(
      widget.getDrawableElements().some((e) => e.fillColor === '#111111')
    ).toBe(true);
  });

  it('uses the disabled color if the specific axis are disabled', async () => {
    const widget = new TransformWidget(canvas, {
      xArrow: '#777777',
      yArrow: '#888888',
      zArrow: '#999999',
      disabledColor: '#333333',
    });

    widget.updateDisabledAxis({
      xRotation: true,
      yRotation: true,
      zRotation: true,
    });
    const frame = makePerspectiveFrame();
    const positionTransform = Matrix4.makeTranslation(Vector3.create(1, 1, 1));

    widget.updateFrame(
      updateFrameCameraPosition(frame, Vector3.create(100, 100, 100))
    );
    widget.updateTransform(positionTransform);

    // the rotatation meshes should all have the disabled fill color
    expect(
      widget
        .getDrawableElements()
        .filter(
          (e) => e.fillColor === '#333333' && e.identifier.includes('rotate')
        ).length
    ).toBe(3);

    // The disabled rotation meshes should have no impact on the translation meshes
    expect(
      widget
        .getDrawableElements()
        .filter(
          (e) => e.fillColor === '#777777' && e.identifier.includes('translate')
        ).length
    ).toBe(1);
    expect(
      widget
        .getDrawableElements()
        .filter(
          (e) => e.fillColor === '#888888' && e.identifier.includes('translate')
        ).length
    ).toBe(1);
    expect(
      widget
        .getDrawableElements()
        .filter(
          (e) => e.fillColor === '#999999' && e.identifier.includes('translate')
        ).length
    ).toBe(1);

    // re-enabling the rotation axis should draw the client given color
    widget.updateDisabledAxis({
      xRotation: false,
      yRotation: false,
      zRotation: false,
    });

    // no rotation mesh contains a disabled color
    expect(
      widget
        .getDrawableElements()
        .filter(
          (e) => e.fillColor === '#333333' && e.identifier.includes('rotate')
        ).length
    ).toBe(0);

    // the colors should now be present
    expect(
      widget
        .getDrawableElements()
        .filter(
          (e) => e.fillColor === '#777777' && e.identifier.includes('rotate')
        ).length
    ).toBe(1);
    expect(
      widget
        .getDrawableElements()
        .filter(
          (e) => e.fillColor === '#888888' && e.identifier.includes('rotate')
        ).length
    ).toBe(1);
    expect(
      widget
        .getDrawableElements()
        .filter(
          (e) => e.fillColor === '#999999' && e.identifier.includes('rotate')
        ).length
    ).toBe(1);
  });
});
