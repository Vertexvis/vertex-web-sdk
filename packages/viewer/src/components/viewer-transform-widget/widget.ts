import { BoundingSphere, Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import regl from 'regl';
import shapeBuilder, { JoinStyle } from 'regl-shape';

import { drawAxis } from '../../lib/transforms/axes';
import { xAxisOutlineMesh } from '../../lib/transforms/axis-arrows';
import { drawLines, drawStandard } from '../../lib/transforms/draw';
import { testMesh } from '../../lib/transforms/hits';
import {
  computeMesh2dBounds,
  Mesh,
  OutlineMesh,
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
  private xOutline!: OutlineMesh;
  private yArrow!: TriangleMesh;
  private zArrow!: TriangleMesh;

  private hoveredMesh?: Mesh;

  private frame?: Frame;
  private position?: Vector3.Vector3;

  public constructor(canvasElement: HTMLCanvasElement) {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
    this.reglCommand = regl({
      canvas: canvasElement,
      extensions: ['ANGLE_instanced_arrays'],
    });
  }

  public getWidgetBounds(): Rectangle.Rectangle | undefined {
    if (this.position != null && this.frame != null) {
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
          this.draw?.(() => {
            this.hoveredMesh?.identifier === m.identifier
              ? m.draw({ color: [1, 1, 0] })
              : m.draw({ color: Vector3.toArray(m.color) });

            drawAxis(
              this.reglCommand,
              currentPosition,
              Vector3.fromArray(m.positions[m.positions.length - 1]),
              m.color
            );
            // this.xOutline.draw({ color: Vector3.toArray(this.xOutline.color) });
            // this.drawLines?.(this.lineData)

            const { createShape } = shapeBuilder(this.reglCommand);
            const res = 32;
            const points = new Float64Array(2 * res).fill(0);
            const shape = createShape(points, {
              join: 'round' as JoinStyle,
              thickness: 12,
              color: Array(res)
                .fill(undefined)
                .map(() => [Math.random(), Math.random(), Math.random()]),
            });

            shape();
          })
        );
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
    if (this.position != null && this.frame != null) {
      const triangleSize =
        Vector3.magnitude(
          Vector3.subtract(this.position, this.frame.scene.camera.position)
        ) * 0.005;

      this.xArrow = xAxisMesh(
        this.reglCommand,
        this.position,
        this.viewport,
        this.frame.scene.camera,
        triangleSize
      );
      this.xOutline = xAxisOutlineMesh(
        this.reglCommand,
        this.position,
        this.viewport,
        this.frame.scene.camera,
        triangleSize
      );
      this.yArrow = yAxisMesh(
        this.reglCommand,
        this.position,
        this.viewport,
        this.frame.scene.camera,
        triangleSize
      );
      this.zArrow = zAxisMesh(
        this.reglCommand,
        this.position,
        this.viewport,
        this.frame.scene.camera,
        triangleSize
      );
    }
  }
}
