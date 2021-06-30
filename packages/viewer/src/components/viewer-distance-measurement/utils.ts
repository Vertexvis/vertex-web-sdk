import { Line3, Matrix4, Point } from '@vertexvis/geometry';
import { Viewport } from '../../lib/types';

export interface ElementPositions {
  startPt?: Point.Point;
  endPt?: Point.Point;
  labelPt?: Point.Point;
}

export interface RenderParams {
  projectionViewMatrix: Matrix4.Matrix4;
  viewport: Viewport;
}

export function translateWorldLineToViewport(
  line: Line3.Line3,
  projectionViewMatrix: Matrix4.Matrix4,
  viewport: Viewport
): { start: Point.Point; end: Point.Point } {
  const ndc = Line3.transformMatrix(line, projectionViewMatrix);
  return {
    start: viewport.transformPointToViewport(ndc.start),
    end: viewport.transformPointToViewport(ndc.end),
  };
}

export function getViewingElementPositions(
  line: Line3.Line3,
  params: RenderParams
): ElementPositions {
  const { projectionViewMatrix, viewport } = params;
  const { start: startPt, end: endPt } = translateWorldLineToViewport(
    line,
    projectionViewMatrix,
    viewport
  );
  const labelPt = Point.lerp(startPt, endPt, 0.5);

  return { startPt, endPt, labelPt };
}

export function isVertexViewerDistanceMeasurement(
  el: unknown
): el is HTMLVertexViewerDistanceMeasurementElement {
  return (
    el instanceof HTMLElement &&
    el.nodeName === 'VERTEX-VIEWER-DISTANCE-MEASUREMENT'
  );
}
