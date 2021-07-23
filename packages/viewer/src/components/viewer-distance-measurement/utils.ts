import { Line3, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { DepthBuffer, Viewport } from '../../lib/types';

export type Anchor = 'start' | 'end';

export interface MeasurementElementPositions {
  startPt?: Point.Point;
  endPt?: Point.Point;
  labelPt?: Point.Point;
  indicatorPt?: Point.Point;
}

export interface RenderParams {
  projectionViewMatrix: Matrix4.Matrix4;
  viewport: Viewport;
}

export function translatePointToWorld(
  pt: Point.Point,
  depthBuffer: DepthBuffer | undefined,
  viewport: Viewport,
  { ignoreDepthTest = false }: { ignoreDepthTest?: boolean } = {}
): Vector3.Vector3 | undefined {
  if (depthBuffer != null) {
    const framePt = viewport.transformPointToFrame(pt, depthBuffer);
    const hasDepth = depthBuffer.isDepthAtFarPlane(framePt);
    const worldPt = viewport.transformPointToWorldSpace(pt, depthBuffer);
    return hasDepth || ignoreDepthTest ? worldPt : undefined;
  }
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
  projectionViewMatrix: Matrix4.Matrix4,
  viewport: Viewport
): { start: Point.Point; end: Point.Point } {
  const ndc = Line3.transformMatrix(line, projectionViewMatrix);
  return {
    start: viewport.transformVectorToViewport(ndc.start),
    end: viewport.transformVectorToViewport(ndc.end),
  };
}

export function getViewingElementPositions(
  line: Line3.Line3,
  interactingAnchor: Anchor | 'none',
  params: RenderParams
): MeasurementElementPositions {
  const { projectionViewMatrix, viewport } = params;
  const { start: startPt, end: endPt } = translateWorldLineToViewport(
    line,
    projectionViewMatrix,
    viewport
  );
  const labelPt = Point.lerp(startPt, endPt, 0.5);
  const indicatorPt =
    interactingAnchor !== 'none'
      ? getIndicatorPtForAnchor(line, interactingAnchor, params)
      : undefined;

  return { startPt, endPt, labelPt, indicatorPt };
}

export function isVertexViewerDistanceMeasurement(
  el: unknown
): el is HTMLVertexViewerDistanceMeasurementElement {
  return (
    el instanceof HTMLElement &&
    el.nodeName === 'VERTEX-VIEWER-DISTANCE-MEASUREMENT'
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
