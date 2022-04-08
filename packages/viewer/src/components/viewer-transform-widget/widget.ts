import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import regl from 'regl';

import { drawAxis } from '../../lib/transforms/axes';
import { drawStandard } from '../../lib/transforms/draw';
import { testMesh } from '../../lib/transforms/hits';
import {
  computeMesh2dBounds,
  Mesh,
  TriangleMesh,
} from '../../lib/transforms/mesh';
import {
  xAxisMesh,
  yAxisMesh,
  zAxisMesh,
} from '../../lib/transforms/translation';
import { Frame, Viewport } from '../../lib/types';

export class TransformGlWidget {
  private reglCommand: regl.Regl;

  private draw?: regl.DrawCommand;

  private viewport: Viewport;
  private cursor?: Point.Point;
  private xArrow!: TriangleMesh;
  private yArrow!: TriangleMesh;
  private zArrow!: TriangleMesh;

  private hoveredMesh?: Mesh;

  private frame?: Frame;
  private position?: Vector3.Vector3;

  public constructor(canvasElement: HTMLCanvasElement) {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
    this.reglCommand = regl(canvasElement);
  }

  public getWidgetBounds(): Rectangle.Rectangle | undefined {
    if (this.frame != null) {
      return computeMesh2dBounds(
        this.viewport,
        this.frame,
        this.xArrow,
        this.yArrow,
        this.zArrow
      );
    }
  }

  public updateFrame(frame: Frame): void {
    this.frame = frame;
    this.draw = drawStandard(this.reglCommand, frame);

    this.createTriangleMeshes();
    this.redraw();
  }

  public updateCursor(cursor?: Point.Point): void {
    this.cursor = cursor;

    if (cursor != null) {
      this.hitTestAndRedraw();
    } else {
      this.hoveredMesh = undefined;
      this.redraw();
    }
  }

  public updatePosition(position?: Vector3.Vector3): void {
    this.position = position;

    if (position != null) {
      this.createTriangleMeshes();
      this.redraw();
    } else {
      this.clear();
    }
  }

  public updateDimensions(canvasElement: HTMLCanvasElement): void {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
    this.reglCommand = regl(canvasElement);

    this.redraw();
  }

  public hovered(): Mesh | undefined {
    return this.hoveredMesh;
  }

  private redraw(): void {
    const currentPosition = this.position;

    if (currentPosition != null) {
      this.draw?.(() => {
        [this.xArrow, this.yArrow, this.zArrow].forEach((m) =>
          this.draw?.(() =>
            this.hoveredMesh?.identifier === m.identifier
              ? m.draw({ color: [1, 1, 0] })
              : m.draw({ color: Vector3.toArray(m.color) })
          )
        );

        drawAxis(this.reglCommand, Vector3.up(), currentPosition);
        drawAxis(this.reglCommand, Vector3.right(), currentPosition);
        drawAxis(this.reglCommand, Vector3.back(), currentPosition);
      });
    }
  }

  private clear(): void {
    this.reglCommand.clear({
      color: [1, 1, 1, 0],
    });
  }

  private hitTestAndRedraw(): void {
    const previousHovered = this.hoveredMesh;
    this.hoveredMesh = undefined;

    const currentFrame = this.frame;

    if (currentFrame != null) {
      [this.xArrow, this.yArrow, this.zArrow].forEach((m) => {
        const isHovered =
          this.cursor != null
            ? testMesh(this.viewport, this.cursor, currentFrame, m)
            : false;

        if (isHovered) {
          this.hoveredMesh = m;
        }
      });
    }

    if (this.hoveredMesh !== previousHovered) {
      this.redraw();
    }
  }

  private createTriangleMeshes(): void {
    if (this.position != null) {
      this.xArrow = xAxisMesh(this.reglCommand, this.position);
      this.yArrow = yAxisMesh(this.reglCommand, this.position);
      this.zArrow = zAxisMesh(this.reglCommand, this.position);
    }
  }
}
