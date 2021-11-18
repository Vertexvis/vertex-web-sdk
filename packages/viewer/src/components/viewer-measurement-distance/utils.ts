import { Line3, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { FramePerspectiveCamera, Viewport } from '../../lib/types';

export type Anchor = 'start' | 'end';

export interface MeasurementElementPositions {
  startPt?: Point.Point;
  endPt?: Point.Point;
  labelPt?: Point.Point;
  indicatorPt?: Point.Point;
  hideStart?: boolean;
  hideEnd?: boolean;
}

export interface RenderParams {
  projectionViewMatrix: Matrix4.Matrix4;
  viewport: Viewport;
  camera: FramePerspectiveCamera;
}

export function translateWorldPtToViewport(
  pt: Vector3.Vector3,
  projectionViewMatrix: Matrix4.Matrix4,
  viewport: Viewport
): Point.Point {
  const ndc = Vector3.transformMatrix(pt, projectionViewMatrix);
  return viewport.transformVectorToViewport(ndc);
}

export function translateWorldLineToViewport(
  line: Line3.Line3,
  params: RenderParams
): {
  start: Point.Point;
  end: Point.Point;
  hideStart: boolean;
  hideEnd: boolean;
} {
  const { camera, projectionViewMatrix, viewport } = params;

  const isStartBehindCamera = camera.isPointBehindNear(line.start);
  const isEndBehindCamera = camera.isPointBehindNear(line.end);

  // If either the start or end of the line is behind the camera, then we need
  // to truncate the line so it can be presented correctly. You cannot use a
  // projection matrix to compute a point behind the near plane.
  if (isStartBehindCamera || isEndBehindCamera) {
    const pt = camera.intersectLineWithNear(line);
    const newLine = Line3.create({
      start: isStartBehindCamera && pt != null ? pt : line.start,
      end: isEndBehindCamera && pt != null ? pt : line.end,
    });

    const ndc = Line3.transformMatrix(newLine, projectionViewMatrix);
    return {
      start: viewport.transformVectorToViewport(ndc.start),
      end: viewport.transformVectorToViewport(ndc.end),
      hideStart: isStartBehindCamera,
      hideEnd: isEndBehindCamera,
    };
  } else {
    const ndc = Line3.transformMatrix(line, projectionViewMatrix);
    return {
      start: viewport.transformVectorToViewport(ndc.start),
      end: viewport.transformVectorToViewport(ndc.end),
      hideStart: false,
      hideEnd: false,
    };
  }
}

export function getViewingElementPositions(
  line: Line3.Line3,
  interactingAnchor: Anchor | 'none',
  params: RenderParams
): MeasurementElementPositions {
  const {
    start: startPt,
    end: endPt,
    hideStart,
    hideEnd,
  } = translateWorldLineToViewport(line, params);
  const labelPt = Point.lerp(startPt, endPt, 0.5);
  const indicatorPt =
    interactingAnchor !== 'none'
      ? getIndicatorPtForAnchor(line, interactingAnchor, params)
      : undefined;

  return { startPt, endPt, labelPt, indicatorPt, hideStart, hideEnd };
}

export function isVertexViewerDistanceMeasurement(
  el: unknown
): el is HTMLVertexViewerMeasurementDistanceElement {
  return (
    el instanceof HTMLElement &&
    el.nodeName === 'VERTEX-VIEWER-MEASUREMENT-DISTANCE'
  );
}

function getIndicatorPtForAnchor(
  line: Line3.Line3,
  anchor: Anchor,
  params: RenderParams
): Point.Point {
  return translateWorldPtToViewport(
    anchor === 'start' ? line.start : line.end,
    params.projectionViewMatrix,
    params.viewport
  );
}
