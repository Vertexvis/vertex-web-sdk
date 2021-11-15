import {
  Dimensions,
  Plane,
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
   * Returns the screen plane for this viewport and given `camera`.
   *
   * @param camera A camera.
   * @returns The screen plane.
   */
  public plane(camera: FramePerspectiveCamera): Plane.Plane {
    const direction = camera.direction;
    const distance = Vector3.distance(camera.position, camera.lookAt);
    return Plane.create({
      normal: direction,
      constant: distance - camera.near,
    });
  }

  /**
   * Transforms a normalized device coordinate to a 2D point within the
   * viewport.
   *
   * @param ndc A 3D point in NDC.
   * @returns A 2D point in the coordinate space of the viewport.
   */
  public transformVectorToViewport(ndc: Vector3.Vector3): Point.Point {
    return Point.create(
      ndc.x * this.center.x + this.center.x,
      -ndc.y * this.center.y + this.center.y
    );
  }

  public transformPointToViewport(
    pt: Point.Point,
    image: FrameImageLike
  ): Point.Point {
    const { x: scaleX, y: scaleY } = this.calculateFrameScale(image);
    return Point.scale(pt, 1 * scaleX, 1 * scaleY);
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

  /**
   * Transforms a point in viewport coordinates to a point in world space
   * coordinates. This method expects a depth buffer in order to compute a value
   * for the Z axis.
   *
   * @param pt A point in viewport coordinates.
   * @param depthBuffer A depth buffer for computing the Z axis.
   * @param fallbackNormalizedDepth A fallback value if the depth is the max
   *   depth value, or cannot be determined.
   * @returns
   */
  public transformPointToWorldSpace(
    pt: Point.Point,
    depthBuffer: DepthBuffer,
    fallbackNormalizedDepth?: number
  ): Vector3.Vector3 {
    const depthPt = this.transformPointToFrame(pt, depthBuffer);
    const ray = this.transformPointToRay(pt, depthBuffer, depthBuffer.camera);
    return depthBuffer.getWorldPoint(depthPt, ray, fallbackNormalizedDepth);
  }

  /**
   * Transforms a point in viewport coordinates to a ray. The returned ray will
   * have an origin that is at the position of the camera with a direction that
   * is pointing into world space away from the camera.
   *
   * @param pt A point in viewport coordinates.
   * @param image An image of a frame.
   * @param camera A camera used to determine orientation of the scene.
   * @returns
   */
  public transformPointToRay(
    pt: Point.Point,
    image: FrameImageLike,
    camera: FramePerspectiveCamera
  ): Ray.Ray {
    const ndc = this.transformScreenPointToNdc(pt, image);
    const origin = Vector3.fromMatrixPosition(camera.worldMatrix);
    const world = Vector3.transformNdcToWorldSpace(
      Vector3.create(ndc.x, ndc.y, 0.5),
      camera.worldMatrix,
      camera.projectionMatrixInverse
    );
    const direction = Vector3.normalize(Vector3.subtract(world, origin));
    return Ray.create({ origin, direction });
  }

  /**
   * Maps a screen point to normalized device coordinates (NDC). A screen point
   * at 0,0 represents the top-left of the viewport.
   *
   * @param screenPt A screen point.
   */
  public transformScreenPointToNdc(
    screenPt: Point.Point,
    image: FrameImageLike
  ): Point.Point {
    const framePt = this.transformPointToFrame(screenPt, image);
    return Point.create(
      (framePt.x / image.imageAttr.frameDimensions.width) * 2 - 1,
      -(framePt.y / image.imageAttr.frameDimensions.height) * 2 + 1
    );
  }

  /**
   * Maps a point in screen space to a world point that is coplanar with the
   * camera's near plane.
   *
   * @param screenPt The screen point to transform.
   * @param image An image of frame.
   * @param camera The camera used to map a 2D point to 3D point.
   * @returns A point on the screen in world space.
   */
  public transformPointToScreenWorld(
    screenPt: Point.Point,
    image: FrameImageLike,
    camera: FramePerspectiveCamera
  ): Vector3.Vector3 | undefined {
    const { direction, near } = camera;

    const ray = this.transformPointToRay(screenPt, image, camera);
    const screen = Plane.create({ normal: direction, constant: near });
    return Ray.intersectPlane(ray, screen);
  }

  /**
   * Computes a rectangle that is scaled correctly to be drawn within the
   * viewport.
   *
   * @param image The image to be drawn.
   * @param imageDimensions The dimensions of the received image.
   * @returns A rectangle.
   */
  public calculateDrawRect(image: FrameImageLike): Rectangle.Rectangle {
    const { x: scaleX, y: scaleY } = this.calculateFrameScale(image);
    return Rectangle.scale(image.imageAttr.imageRect, scaleX, scaleY);
  }

  private calculateFrameScale(image: FrameImageLike): Point.Point {
    const { frameDimensions: dimensions } = image.imageAttr;

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
