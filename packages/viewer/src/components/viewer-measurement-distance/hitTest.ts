import { Point, Vector3 } from '@vertexvis/geometry';
import { DepthBuffer, StencilBuffer, Viewport } from '../../lib/types';

export class PointToPointHitTester {
  public constructor(
    private stencil: StencilBuffer,
    private depthBuffer: DepthBuffer,
    private viewport: Viewport
  ) {}

  public hitTest(pt: Point.Point): boolean {
    const stencilPt = this.viewport.transformPointToFrame(pt, this.stencil);
    const depthPt = this.viewport.transformPointToFrame(pt, this.depthBuffer);
    return this.stencil.hitTest(stencilPt) || this.depthBuffer.hitTest(depthPt);
  }

  public snapToNearestPixel(pt: Point.Point, radius: number): Point.Point {
    const framePt = this.viewport.transformPointToFrame(pt, this.stencil);
    const snapPt = this.stencil.snapToNearestPixel(framePt, radius);
    return this.viewport.transformPointToViewport(snapPt, this.stencil);
  }

  public transformPointToWorld(
    pt: Point.Point,
    { ignoreHitTest = false }: { ignoreHitTest?: boolean } = {}
  ): Vector3.Vector3 | undefined {
    const buffer = this.pickDepthBuffer(pt);

    if (buffer != null) {
      return this.viewport.transformPointToWorldSpace(pt, buffer);
    } else if (ignoreHitTest) {
      return this.viewport.transformPointToWorldSpace(pt, this.depthBuffer);
    }
  }

  private pickDepthBuffer(pt: Point.Point): DepthBuffer | undefined {
    const stencilPt = this.viewport.transformPointToFrame(pt, this.stencil);
    if (this.stencil.hitTest(stencilPt)) {
      return this.stencil.depthBuffer;
    }

    const depthPt = this.viewport.transformPointToFrame(pt, this.depthBuffer);
    return this.depthBuffer.hitTest(depthPt) ? this.depthBuffer : undefined;
  }
}
