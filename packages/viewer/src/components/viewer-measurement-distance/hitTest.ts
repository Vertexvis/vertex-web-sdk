import { Point, Vector3 } from '@vertexvis/geometry';

import { DepthBuffer, StencilBuffer, Viewport } from '../../lib/types';

export class PointToPointHitTester {
  public constructor(
    private stencil: StencilBuffer | undefined,
    private depthBuffer: DepthBuffer,
    private viewport: Viewport
  ) {}

  public hitTest(pt: Point.Point): boolean {
    const dpt = this.viewport.transformPointToFrame(pt, this.depthBuffer);
    if (this.stencil != null) {
      const spt = this.viewport.transformPointToFrame(pt, this.stencil);
      return this.stencil.hitTest(spt) || this.depthBuffer.hitTest(dpt);
    } else {
      return this.depthBuffer.hitTest(dpt);
    }
  }

  public snapToNearestPixel(pt: Point.Point, radius: number): Point.Point {
    if (this.stencil != null) {
      const framePt = this.viewport.transformPointToFrame(pt, this.stencil);
      const snapPt = this.stencil.snapToNearestPixel(framePt, radius);
      return this.viewport.transformPointToViewport(snapPt, this.stencil);
    } else {
      return pt;
    }
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
    if (this.stencil != null) {
      const stencilPt = this.viewport.transformPointToFrame(pt, this.stencil);
      if (this.stencil.hitTest(stencilPt)) {
        return this.stencil.depthBuffer;
      }
    }

    const depthPt = this.viewport.transformPointToFrame(pt, this.depthBuffer);
    return this.depthBuffer.hitTest(depthPt) ? this.depthBuffer : undefined;
  }
}
