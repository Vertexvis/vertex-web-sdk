import { Line3, Matrix4, Point } from '@vertexvis/geometry';
import { Viewport } from '../../lib/types';

export interface ElementPositions {
  startPt: Point.Point;
  endPt?: Point.Point;
  labelPt?: Point.Point;
  distance?: number | undefined;
}

export interface RenderParams {
  projectionViewMatrix: Matrix4.Matrix4;
  viewport: Viewport;
  valid: boolean;
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
  const { projectionViewMatrix, viewport, valid } = params;
  const { start: startPt, end: endPt } = translateWorldLineToViewport(
    line,
    projectionViewMatrix,
    viewport
  );
  const labelPt = Point.lerp(startPt, endPt, 0.5);
  const distance = valid ? Line3.distance(line) : undefined;

  return { startPt, endPt, labelPt, distance };
}
