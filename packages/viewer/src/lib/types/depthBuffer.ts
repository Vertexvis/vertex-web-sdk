import { Dimensions, Point, Ray, Rectangle } from '@vertexvis/geometry';
import { Vector3 } from '@vertexvis/geometry';
import type { IDecodedPNG } from 'fast-png';
import { FrameImageLike, FramePerspectiveCamera } from './frame';
import { Viewport } from './viewport';

/**
 * A `DepthBuffer` represents the depth information for a rendered frame. This
 * depth information can be used for checking if a world point is occluded by
 * geometry or getting a world position from a 2D viewport point without having
 * to do a server call.
 *
 * A depth buffer is represented by a 16-bit typed array, where each value is
 * a relative distance between the camera's near and far planes.
 */
export class DepthBuffer implements FrameImageLike {
  /**
   * A constant that specifies the maximum depth value that can be represented
   * by a depth buffer.
   */
  public static MAX_DEPTH_VALUE = 2 ** 16 - 1;

  /**
   * Constructs a new depth buffer.
   *
   * @param camera The camera data that generated this depth buffer.
   * @param dimensions The dimensions of the frame used to generate this depth
   *   buffer.
   * @param rect The placement of the depth image within the viewport.
   * @param scale The scale factor of the depth image.
   * @param data A 16-bit typed array of depth values.
   * @param imageDimensions The dimensions of the depth image.
   */
  public constructor(
    public readonly camera: FramePerspectiveCamera,
    public readonly dimensions: Dimensions.Dimensions,
    public readonly rect: Rectangle.Rectangle,
    public readonly scale: number,
    public readonly data: Uint16Array,
    public readonly imageDimensions: Dimensions.Dimensions
  ) {}

  /**
   * Creates a `DepthBuffer` from a decoded PNG.
   *
   * @param png An object containing the width, height and raw PNG data.
   * @param imageRect The placement of the depth image in the viewport.
   * @param imageScaleFactor The scale factor of the depth image.
   * @throws If the PNG is not a single channel, 16-bit image.
   * @returns A depth buffer.
   */
  public static fromPng(
    png: Pick<IDecodedPNG, 'width' | 'height' | 'data'>,
    camera: FramePerspectiveCamera,
    dimensions: Dimensions.Dimensions,
    imageRect: Rectangle.Rectangle,
    imageScaleFactor: number
  ): DepthBuffer {
    if (png.data instanceof Uint16Array) {
      return new DepthBuffer(
        camera,
        dimensions,
        imageRect,
        imageScaleFactor,
        png.data,
        Dimensions.create(png.width, png.height)
      );
    } else {
      throw new Error('Expected depth PNG to have depth of 16-bit');
    }
  }

  /**
   * Computes the depth from a 2D point within the coordinate space of the depth
   * buffer. The returned depth is a value that's between the near and far plane
   * of the camera.
   *
   * @param point A 2D point within the viewport.
   * @param fallbackNormalizedDepth A fallback value if the depth is the max
   *   depth value, or cannot be determined.
   * @returns A depth between the near and far plane.
   */
  public getLinearDepthAtPoint(
    point: Point.Point,
    fallbackNormalizedDepth?: number
  ): number {
    const { near, far } = this.camera;
    const depth = this.getNormalizedDepthAtPoint(
      point,
      fallbackNormalizedDepth
    );
    return depth * (far - near) + near;
  }

  /**
   * Computes a depth from a 2D point within the coordinate space of the frame.
   * The returned depth is a normalized value (`[0, 1]`) between the near and
   * far plane.
   *
   * @param point A 2D point within the frame.
   * @param fallbackNormalizedDepth A fallback value if the depth is the max
   *   depth value, or cannot be determined.
   * @returns A depth between 0 and 1.
   */
  public getNormalizedDepthAtPoint(
    point: Point.Point,
    fallbackNormalizedDepth?: number
  ): number {
    const { width, height } = this.imageDimensions;

    const offset = Point.subtract(point, this.rect);
    const scale = 1 / this.scale;
    const pixel = Point.scale(offset, scale, scale);

    if (pixel.x >= 1 && pixel.y >= 1 && pixel.x <= width && pixel.y <= height) {
      const index = Math.floor(pixel.x) - 1 + (Math.floor(pixel.y) - 1) * width;
      const depth = this.data[index];
      const depthOrFallback =
        depth === DepthBuffer.MAX_DEPTH_VALUE
          ? fallbackNormalizedDepth ?? depth
          : depth;
      return (
        (depthOrFallback ?? DepthBuffer.MAX_DEPTH_VALUE) /
        DepthBuffer.MAX_DEPTH_VALUE
      );
    } else {
      return fallbackNormalizedDepth ?? 1;
    }
  }

  /**
   * Computes a 3D point in world space coordinates from the depth value at the
   * given pixel and ray.
   *
   * @param point A pixel to use for reading a depth value.
   * @param ray A ray that specifies the origin and direction.
   * @param fallbackNormalizedDepth A fallback value if the depth is the max
   *   depth value, or cannot be determined.
   * @returns A point in world space coordinates.
   */
  public getWorldPoint(
    point: Point.Point,
    ray: Ray.Ray,
    fallbackNormalizedDepth?: number
  ): Vector3.Vector3 {
    const distance = this.getLinearDepthAtPoint(point, fallbackNormalizedDepth);
    const vv = Vector3.subtract(this.camera.lookAt, this.camera.position);

    // Compute the world position along the ray at the far plane.
    // This is used to determine the angle with the view vector.
    const worldPt = Ray.at(ray, this.camera.far);
    const eyeToWorldPt = Vector3.subtract(worldPt, this.camera.position);

    const angle =
      Vector3.dot(vv, eyeToWorldPt) /
      (Vector3.magnitude(vv) * Vector3.magnitude(eyeToWorldPt));
    return Ray.at(ray, distance / angle);
  }

  /**
   * Returns `true` if the given point in world space is occluded by any
   * geometry.
   *
   * @param worldPt A point in world space to check.
   * @param viewport A viewport of the viewer.
   * @returns `true` if the world point is occluded. `false` otherwise.
   */
  public isOccluded(worldPt: Vector3.Vector3, viewport: Viewport): boolean {
    const { position, direction, projectionViewMatrix } = this.camera;

    const eyeToPoint = Vector3.subtract(worldPt, position);
    const projected = Vector3.project(eyeToPoint, direction);
    const distance = Vector3.magnitude(projected);

    const ndc = Vector3.transformMatrix(worldPt, projectionViewMatrix);
    const screenPt = viewport.transformPointToViewport(ndc);
    const scaledPt = viewport.transformPointToFrame(screenPt, this);
    const depth = this.getLinearDepthAtPoint(scaledPt);

    return distance > depth;
  }
}
