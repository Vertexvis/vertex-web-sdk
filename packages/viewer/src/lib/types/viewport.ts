import { Dimensions, Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import type { FrameImageLike } from './frame';

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
  public readonly center: Point.Point;

  public constructor(public dimensions: Dimensions.Dimensions) {
    this.center = Dimensions.center(dimensions);
  }

  /**
   * Transforms a normalized device coordinate to a 2D point within the
   * viewport.
   *
   * @param ndc A 3D point in NDC.
   * @returns A 2D point in the coordinate space of the viewport.
   */
  public transformNdc(ndc: Vector3.Vector3): Point.Point {
    return Point.create(
      ndc.x * this.center.x + this.center.x,
      -ndc.y * this.center.y + this.center.y
    );
  }

  /**
   * Transforms a point in viewport coordinate space to a point in a frame's coordinate space.
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

  /**
   * The width of the viewport.
   */
  public get width(): number {
    return this.dimensions.width;
  }

  /**
   * The height of the viewport.
   */
  public get height(): number {
    return this.dimensions.height;
  }
}
