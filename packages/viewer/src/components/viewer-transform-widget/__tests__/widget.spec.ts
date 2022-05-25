jest.mock('regl-shape');
jest.mock('regl');
jest.mock('../../../lib/transforms/hits', () => ({
  testTriangleMesh: jest.fn(),
}));

import { Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import { axisPositions } from '../../../lib/transforms/axis-lines';
import {
  xAxisArrowPositions,
  yAxisArrowPositions,
  zAxisArrowPositions,
} from '../../../lib/transforms/axis-translation';
import { testTriangleMesh } from '../../../lib/transforms/hits';
import { AxisMesh, TriangleMesh } from '../../../lib/transforms/mesh';
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
import { DEFAULT_MESH_SCALAR, TransformWidget } from '../widget';

type MockShapeBuilder = jest.Mock<{ createShape: jest.Mock }>;

const mockShapeBuilder = shapeBuilder as MockShapeBuilder;

function createMeshes(
  position: Vector3.Vector3,
  frame: Frame,
  triangleSize?: number
): {
  xArrow: TriangleMesh;
  yArrow: TriangleMesh;
  zArrow: TriangleMesh;
  xAxis: AxisMesh;
  yAxis: AxisMesh;
  zAxis: AxisMesh;
} {
  const expectedTriangleSize =
    triangleSize ??
    Vector3.magnitude(Vector3.subtract(position, frame.scene.camera.position)) *
      DEFAULT_MESH_SCALAR;

  const xArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'x-translate',
    xAxisArrowPositions(position, frame.scene.camera, expectedTriangleSize),
    '#000000',
    '#000000'
  );
  const xAxis = new AxisMesh(
    mockShapeBuilder().createShape,
    'x-axis',
    axisPositions(position, frame.scene.camera, xArrow),
    '#000000',
    '#000000'
  );
  const yArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'y-translate',
    yAxisArrowPositions(position, frame.scene.camera, expectedTriangleSize),
    '#000000',
    '#000000'
  );
  const yAxis = new AxisMesh(
    mockShapeBuilder().createShape,
    'y-axis',
    axisPositions(position, frame.scene.camera, yArrow),
    '#000000',
    '#000000'
  );
  const zArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'z-translate',
    zAxisArrowPositions(position, frame.scene.camera, expectedTriangleSize),
    '#000000',
    '#000000'
  );
  const zAxis = new AxisMesh(
    mockShapeBuilder().createShape,
    'z-axis',
    axisPositions(position, frame.scene.camera, zArrow),
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
    widget.updatePosition(Vector3.create(1, 1, 1));

    expect(regl).toHaveBeenCalledWith(
      expect.objectContaining({
        canvas,
        extensions: ['ANGLE_instanced_arrays'],
      })
    );
    expect(mockShapeBuilder().createShape).toHaveBeenCalled();
    expect(regl().frame).toHaveBeenCalled();
  });

  it('creates axis and arrow meshes', async () => {
    const widget = new TransformWidget(canvas);
    const frame = makePerspectiveFrame();
    const position = Vector3.create(1, 1, 1);
    const meshes = createMeshes(position, frame);

    mockShapeBuilder().createShape.mockClear();
    widget.updateFrame(frame);
    widget.updatePosition(position);

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
    const position = Vector3.create(1, 1, 1);
    const meshes = createMeshes(
      position,
      frame,
      (frame.scene.camera as FrameOrthographicCamera).fovHeight *
        DEFAULT_MESH_SCALAR
    );

    mockShapeBuilder().createShape.mockClear();
    widget.updateFrame(frame);
    widget.updatePosition(position);

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

    const position = Vector3.create(1, 1, 1);

    widget.updateFrame(xFrame);
    widget.updatePosition(position);

    expect(widget.getDrawableMeshes().map((m) => m.identifier)).toMatchObject(
      [
        'x-translate',
        'x-axis',
        'y-translate',
        'y-axis',
        'z-axis',
        'z-translate',
      ].reverse()
    );

    widget.updateFrame(yFrame);

    expect(widget.getDrawableMeshes().map((m) => m.identifier)).toMatchObject(
      [
        'y-translate',
        'y-axis',
        'z-translate',
        'z-axis',
        'x-axis',
        'x-translate',
      ].reverse()
    );

    widget.updateFrame(zFrame);

    expect(widget.getDrawableMeshes().map((m) => m.identifier)).toMatchObject(
      [
        'z-translate',
        'z-axis',
        'x-translate',
        'x-axis',
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
    const position = Vector3.create(1, 1, 1);
    const meshes = createMeshes(position, frame);
    const hoveredListener = jest.fn();

    (testTriangleMesh as jest.Mock).mockImplementation(
      (m) => m.identifier === 'x-translate'
    );

    widget.onHoveredChanged(hoveredListener);
    widget.updateFrame(frame);
    widget.updatePosition(position);
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
    const position = Vector3.create(1, 1, 1);

    widget.updateFrame(
      updateFrameCameraPosition(frame, Vector3.create(100, 100, 100))
    );
    widget.updatePosition(position);

    widget.updateColors({
      xArrow: '#333333',
      yArrow: '#444444',
      zArrow: undefined,
    });

    expect(
      widget.getDrawableMeshes().some((m) => m.fillColor === '#333333')
    ).toBe(true);
    expect(
      widget.getDrawableMeshes().some((m) => m.fillColor === '#444444')
    ).toBe(true);
    expect(
      widget.getDrawableMeshes().some((m) => m.fillColor === '#555555')
    ).toBe(true);

    widget.updateColors({
      xArrow: undefined,
      yArrow: undefined,
      zArrow: '#111111',
    });

    expect(
      widget.getDrawableMeshes().some((m) => m.fillColor === '#333333')
    ).toBe(true);
    expect(
      widget.getDrawableMeshes().some((m) => m.fillColor === '#444444')
    ).toBe(true);
    expect(
      widget.getDrawableMeshes().some((m) => m.fillColor === '#111111')
    ).toBe(true);
  });
});
