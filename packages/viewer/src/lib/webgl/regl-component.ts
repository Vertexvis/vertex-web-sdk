import { Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import regl from 'regl';

import { Drawable } from '../transforms/drawable';
import { Frame, Viewport } from '../types';

// Scalar that is used in combination with a perspective camera's
// components to determine the relative size of the meshes.
// This attempts to keep the widget approximately the same
// size as zooming occurs.
export const DEFAULT_PERSPECTIVE_MESH_SCALAR = 0.005;

// Scalar that is used in combination with an orthographic camera's
// components to determine the relative size of the meshes.
// This attempts to keep the widget approximately the same
// size as zooming occurs.
export const DEFAULT_ORTHOGRAPHIC_MESH_SCALAR = 0.00625;

// Scalar that is used to increase the relative triangle size
// in small viewing windows. This attempts to keep the widget
// approximately the same size for all viewing window sizes.
export const TRIANGLE_SIZE_CANVAS_AREA_ADJUSTMENT_NUMERATOR = 1580000;

// Scalar that is used to increase the relative triangle size
// in small viewing windows. This attempts to keep the widget
// approximately the same size for all viewing window sizes.
export const TRIANGLE_SIZE_CANVAS_AREA_ADJUSTMENT_DENOMINATOR = 520000;

export abstract class ReglComponent implements Disposable {
  protected reglCommand?: regl.Regl;
  protected reglFrameDisposable?: regl.Cancellable;

  protected availableElements: Drawable[] = [];
  protected drawableElements: Drawable[] = [];

  protected frame?: Frame;
  protected viewport: Viewport;

  public constructor(protected canvasElement: HTMLCanvasElement) {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
  }

  public dispose(): void {
    this.reglFrameDisposable?.cancel();
  }

  public updateFrame(frame: Frame, redraw = true): void {
    this.frame = frame;

    if (redraw) {
      this.updateAndDraw();
    }
  }

  public updateDimensions(canvasElement: HTMLCanvasElement): void {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);

    this.createOrUpdateElements();
  }

  public updateAndDraw(): void {
    if (this.frame != null && this.hasData()) {
      this.createOrUpdateElements();
      this.sortMeshes(this.frame, ...this.availableElements);
      this.draw();
    }
  }

  /**
   * @internal - visible for testing
   */
  public getDrawableElements(): Drawable[] {
    return this.drawableElements;
  }

  protected draw(): void {
    if (this.reglFrameDisposable == null) {
      this.reglFrameDisposable = this.reglCommand?.frame(() => {
        this.drawableElements.forEach((el) =>
          el?.draw({
            fill: el.fillColor,
            opacity: !!el.disabled ? 0.2 : 1,
          })
        );
      });
    }
  }

  protected clear(): void {
    this.reglCommand?.clear({
      color: [0, 0, 0, 0],
    });
  }

  protected sortMeshes(
    frame: Frame,
    ...drawableElements: Array<Drawable | undefined>
  ): void {
    const compare = (d1: Drawable, d2: Drawable): number =>
      d1.points.shortestDistanceFrom(frame.scene.camera.position) -
      d2.points.shortestDistanceFrom(frame.scene.camera.position);

    // Reverse sorted elements to draw the closest element last.
    // This causes it to appear above any other element.
    this.drawableElements = (
      drawableElements.filter((el) => el != null) as Drawable[]
    )
      .filter((el) => el.points.valid)
      .sort(compare)
      .reverse();
  }

  protected computeTriangleSize(
    position: Vector3.Vector3,
    frame: Frame
  ): number {
    const baseTriangleSize = frame.scene.camera.isOrthographic()
      ? frame.scene.camera.fovHeight * DEFAULT_ORTHOGRAPHIC_MESH_SCALAR
      : Vector3.magnitude(
          Vector3.subtract(position, frame.scene.camera.position)
        ) * DEFAULT_PERSPECTIVE_MESH_SCALAR;

    // Increase the triangle size for small viewers
    const canvasArea = this.canvasElement.height * this.canvasElement.width;
    const canvasSizeAdjustment = Math.max(
      TRIANGLE_SIZE_CANVAS_AREA_ADJUSTMENT_NUMERATOR /
        (canvasArea + TRIANGLE_SIZE_CANVAS_AREA_ADJUSTMENT_DENOMINATOR),
      1
    );

    return baseTriangleSize * canvasSizeAdjustment;
  }

  protected abstract createOrUpdateElements(): void;

  protected abstract hasData(): boolean;
}
