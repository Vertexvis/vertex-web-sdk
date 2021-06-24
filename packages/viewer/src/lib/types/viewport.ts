import {
  Angle,
  Dimensions,
  Matrix4,
  Point,
  Ray,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import { FramePerspectiveCamera } from './frame';
import type { FrameImageLike } from './frame';
import { DepthBuffer } from './depthBuffer';

/**
 * A `Viewport` represents the drawing area in the viewer.
 *
 * When a frame is received from the rendering pipeline, it might not be the
 * same dimensions of the viewport because of an interactive frame or because of
 * bandwidth limitations or other performance reasons.
 *
 * The viewport contains methods to scale an image to the viewport, as well as
 * translate 2D coordinates between the viewport and the frame.
 */
export class Viewport implements Dimensions.Dimensions {
  /**
   * The center point of the viewport.
   */
  public readonly center: Point.Point;

  public constructor(
    /**
     * The width of the viewport.
     */
    public readonly width: number,

    /**
     * The height of the viewport.
     */
    public readonly height: number
  ) {
    this.center = Dimensions.center(this.dimensions);
  }

  /**
   * Returns a new viewport with the given dimensions.
   * @param dimensions The dimensions of the viewport
   * @returns A new viewport.
   */
  public static fromDimensions(dimensions: Dimensions.Dimensions): Viewport {
    return new Viewport(dimensions.width, dimensions.height);
  }

  /**
   * @deprecated
   *
   * Transforms a normalized device coordinate to a 2D point within the
   * viewport.
   *
   * @param ndc A 3D point in NDC.
   * @returns A 2D point in the coordinate space of the viewport.
   */
  public transformNdc(ndc: Vector3.Vector3): Point.Point {
    return this.transformPointToViewport(ndc);
  }

  /**
   * Transforms a normalized device coordinate to a 2D point within the
   * viewport.
   *
   * @param ndc A 3D point in NDC.
   * @returns A 2D point in the coordinate space of the viewport.
   */
  public transformPointToViewport(ndc: Vector3.Vector3): Point.Point {
    return Point.create(
      ndc.x * this.center.x + this.center.x,
      -ndc.y * this.center.y + this.center.y
    );
  }

  /**
   * Transforms a point in viewport coordinate space to a point in a frame's
   * coordinate space.
   *
   * @param pt A point in viewport coordinate space.
   * @param image An image of a frame.
   * @returns A point in the coordinate space of the frame.
   */
  public transformPointToFrame(
    pt: Point.Point,
    image: FrameImageLike
  ): Point.Point {
    const { x: scaleX, y: scaleY } = this.calculateFrameScale(image);
    return Point.scale(pt, 1 / scaleX, 1 / scaleY);
  }

  public transformPointToWorldSpace(
    pt: Point.Point,
    depthBuffer: DepthBuffer
  ): Vector3.Vector3 {
    const depthPt = this.transformPointToFrame(pt, depthBuffer);
    const ray = this.transformPointToRay(pt, depthBuffer, depthBuffer.camera);
    return depthBuffer.getWorldPoint(depthPt, ray);
  }

  public transformPointToRay(
    pt: Point.Point,
    image: FrameImageLike,
    camera: FramePerspectiveCamera
  ): Ray.Ray {
    const { position, lookAt, up, aspectRatio, fovY } = camera;
    const framePt = this.transformPointToFrame(pt, image);
    const m = Matrix4.position(
      Matrix4.makeLookAt(position, lookAt, up),
      Matrix4.makeIdentity()
    );
    const normal = Vector3.normalize(
      Vector3.create(
        (framePt.x / image.dimensions.width - 0.5) * aspectRatio,
        -(framePt.y / image.dimensions.height) + 0.5,
        -0.5 / Math.tan(Angle.toRadians(fovY / 2.0))
      )
    );
    const direction = Vector3.normalize(Vector3.transformMatrix(normal, m));
    return Ray.create({ origin: position, direction });
  }

  /**
   * Computes a rectangle that is scaled correctly to be drawn within the
   * viewport.
   *
   * @param image The image to be drawn.
   * @param imageDimensions The dimensions of the received image.
   * @returns A rectangle.
   */
  public calculateDrawRect(
    image: FrameImageLike,
    // TODO(dan): This argument shouldn't be needed, but the dimensions of the rectangle returned by FSS are wrong.
    // https://vertexvis.atlassian.net/browse/API-1960
    imageDimensions: Dimensions.Dimensions
  ): Rectangle.Rectangle {
    const { rect, scale } = image;
    const { x: scaleX, y: scaleY } = this.calculateFrameScale(image);

    return Rectangle.create(
      rect.x * scaleX,
      rect.y * scaleY,
      imageDimensions.width * scale * scaleX,
      imageDimensions.height * scale * scaleY
    );
  }

  private calculateFrameScale(image: FrameImageLike): Point.Point {
    const { dimensions } = image;

    const imageRect = Rectangle.fromDimensions(dimensions);
    const viewport = Rectangle.fromDimensions(this.dimensions);
    const fit = Rectangle.containFit(viewport, imageRect);

    const scaleX = fit.width / imageRect.width;
    const scaleY = fit.height / imageRect.height;

    return Point.create(scaleX, scaleY);
  }

  public get dimensions(): Dimensions.Dimensions {
    return Dimensions.create(this.width, this.height);
  }
}
