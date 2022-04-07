import {
  Dimensions,
  Matrix4,
  Point,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import regl from 'regl';

import { Frame, FrameCameraBase, Viewport } from '../../lib/types';
import { draw } from './draw';
import { Mesh, TriangleMesh } from './mesh';
import {
  compute2dBounds,
  drawDirection,
  hitTest,
  triangleElements,
  xAxisPositions,
  yAxisPositions,
  zAxisPositions,
} from './util';

export class TransformGlWidget {
  private reglCommand: regl.Regl;

  private drawStandard?: regl.DrawCommand;

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

    this.createTriangleMeshes();
  }

  public getViewportBounds(): Rectangle.Rectangle | undefined {
    if (this.frame != null) {
      return compute2dBounds(
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
    this.drawStandard = draw(this.reglCommand, frame);

    this.createTriangleMeshes();
    this.redraw();
  }

  public updateCursor(cursor: Point.Point): void {
    this.cursor = cursor;

    this.hitTestAndRedraw();
  }

  public updatePosition(position: Vector3.Vector3): void {
    this.position = position;

    this.createTriangleMeshes();
    this.redraw();
  }

  public hovered(): Mesh | undefined {
    return this.hoveredMesh;
  }

  private redraw(): void {
    this.drawStandard?.(() => {
      [this.xArrow, this.yArrow, this.zArrow].forEach((m) =>
        this.drawStandard?.(() =>
          this.hoveredMesh?.identifier === m.identifier
            ? m.draw({ color: [1, 1, 0] })
            : m.draw({ color: Vector3.toArray(m.color) })
        )
      );

      drawDirection(this.reglCommand, Vector3.up(), 3, this.position);
      drawDirection(this.reglCommand, Vector3.right(), 3, this.position);
      drawDirection(this.reglCommand, Vector3.back(), 3, this.position);
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
            ? hitTest(this.viewport, this.cursor, currentFrame, m)
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
    this.xArrow = new TriangleMesh(
      this.reglCommand,
      'x-translate',
      xAxisPositions(3, this.position, this.frame?.scene.camera),
      triangleElements(),
      Vector3.right()
    );
    this.yArrow = new TriangleMesh(
      this.reglCommand,
      'y-translate',
      yAxisPositions(3, this.position, this.frame?.scene.camera),
      triangleElements(),
      Vector3.up()
    );
    this.zArrow = new TriangleMesh(
      this.reglCommand,
      'z-translate',
      zAxisPositions(3, this.position, this.frame?.scene.camera),
      triangleElements(),
      Vector3.back()
    );
  }
}
