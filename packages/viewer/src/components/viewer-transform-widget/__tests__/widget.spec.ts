jest.mock('regl-shape');
jest.mock('regl');
jest.mock('../../../lib/transforms/hits', () => ({
  testTriangleMesh: jest.fn(),
}));

import { Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import { axisPositions } from '../../../lib/transforms/axis';
import {
  xAxisArrowPositions,
  yAxisArrowPositions,
  zAxisArrowPositions,
} from '../../../lib/transforms/axis-arrows';
import { testTriangleMesh } from '../../../lib/transforms/hits';
import { AxisMesh, TriangleMesh } from '../../../lib/transforms/mesh';
import { flattenPointArray } from '../../../lib/transforms/util';
import { Frame, FrameCameraBase, FrameScene } from '../../../lib/types';
import {
  makeDepthImagePng,
  makeFeatureMapBytes,
  makePerspectiveFrame,
} from '../../../testing/fixtures';
import { TransformWidget } from '../widget';

type MockShapeBuilder = jest.Mock<{ createShape: jest.Mock }>;

const mockShapeBuilder = shapeBuilder as MockShapeBuilder;

function createMeshes(
  position: Vector3.Vector3,
  frame: Frame
): {
  xArrow: TriangleMesh;
  yArrow: TriangleMesh;
  zArrow: TriangleMesh;
  xAxis: AxisMesh;
  yAxis: AxisMesh;
  zAxis: AxisMesh;
} {
  const triangleSize =
    Vector3.magnitude(Vector3.subtract(position, frame.scene.camera.position)) *
    0.005;

  const xArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'x-translate',
    xAxisArrowPositions(position, frame.scene.camera, triangleSize),
    Color.fromHexString('#000000'),
    Color.fromHexString('#ff0000')
  );
  const xAxis = new AxisMesh(
    mockShapeBuilder().createShape,
    'x-axis',
    axisPositions(position, frame.scene.camera, xArrow),
    Color.fromHexString('#000000'),
    Color.fromHexString('#ff0000')
  );
  const yArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'y-translate',
    yAxisArrowPositions(position, frame.scene.camera, triangleSize),
    Color.fromHexString('#000000'),
    Color.fromHexString('#00ff00')
  );
  const yAxis = new AxisMesh(
    mockShapeBuilder().createShape,
    'y-axis',
    axisPositions(position, frame.scene.camera, yArrow),
    Color.fromHexString('#000000'),
    Color.fromHexString('#00ff00')
  );
  const zArrow = new TriangleMesh(
    mockShapeBuilder().createShape,
    'z-translate',
    zAxisArrowPositions(position, frame.scene.camera, triangleSize),
    Color.fromHexString('#000000'),
    Color.fromHexString('#0000ff')
  );
  const zAxis = new AxisMesh(
    mockShapeBuilder().createShape,
    'z-axis',
    axisPositions(position, frame.scene.camera, zArrow),
    Color.fromHexString('#000000'),
    Color.fromHexString('#0000ff')
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

  it('updates the hovered mesh', async () => {
    const widget = new TransformWidget(canvas);
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
  });
});
