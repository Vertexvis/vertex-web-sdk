import { Point, Ray } from '@vertexvis/geometry';
import { Vector3 } from '@vertexvis/geometry';
import type { DecodedPng } from 'fast-png';

import { FrameCameraBase, FrameImageLike, ImageAttributesLike } from './frame';
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
   * @param imageAttr The attributes of the depth buffer image.
   * @param pixels A 16-bit typed array of depth values.
   */
  public constructor(
    public readonly camera: FrameCameraBase,
    public readonly imageAttr: ImageAttributesLike,
    public readonly pixels: Uint16Array
  ) {}

  /**
   * Creates a `DepthBuffer` from a decoded PNG.
   *
   * @param png An object containing the width, height and raw PNG data.
   * @param camera The camera that generated the depth buffer image.
   * @param imageAttr The attributes of the depth buffer image.
   * @throws If the PNG is not a single channel, 16-bit image.
   * @returns A depth buffer.
   */
  public static fromPng(
    png: Pick<DecodedPng, 'data'>,
    camera: FrameCameraBase,
    imageAttr: ImageAttributesLike
  ): DepthBuffer {
    if (png.data instanceof Uint16Array) {
      return new DepthBuffer(camera, imageAttr, png.data);
    } else {
      throw new Error('Expected depth PNG to have depth of 16-bit');
    }
  }

  /**
   * Computes the depth from a 2D point within the coordinate space of the depth
   * buffer.
   *
   * For perspective cameras, the returned depth is a value that's between
   * the near and far planes of the camera.

   * For orthographic cameras, the returned depth is a value that's between
   * 0 and the distance between the near and far planes of the camera.
   *
   * @param point A 2D point within the viewport.
   * @param fallbackNormalizedDepth A fallback value if the depth is the max
   *   depth value, or cannot be determined.
   * @returns The depth at the point.
   */
  public getDepthAtPoint(
    point: Point.Point,
    fallbackNormalizedDepth?: number
  ): number {
    const { near, far } = this.camera;
    const isPerspectiveCamera = this.camera.isPerspective();

    const depth = this.getNormalizedDepthAtPoint(
      point,
      fallbackNormalizedDepth
    );

    if (isPerspectiveCamera) {
      return depth * (far - near) + near;
    } else {
      return depth * (far - near);
    }
  }

  /**
   * Computes the maximum depth of visible geometry within the coordinate
   * space of the depth buffer.
   *
   * For perspective cameras, the maximum depth is the magnitude
   * of the far plane of the camera.
   *
   * For orthographic cameras, the maximum depth is the distance between
   * the near and far planes of the camera.
   *
   * @returns The maximum depth of visible geometry.
   */
  public getMaxDepthOfGeometry(): number {
    const { near, far } = this.camera;
    const isPerspectiveCamera = this.camera.isPerspective();

    if (isPerspectiveCamera) {
      return far;
    } else {
      return far - near;
    }
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
    const { width, height } = this.imageAttr.imageRect;

    const offset = Point.subtract(point, this.imageAttr.imageRect);
    const scale = 1 / this.imageAttr.imageScale;
    const pixel = Point.scale(offset, scale, scale);

    if (pixel.x >= 0 && pixel.y >= 0 && pixel.x < width && pixel.y < height) {
      const index = Math.floor(pixel.x) + Math.floor(pixel.y) * width;
      const depth = this.pixels[index];

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
   * Returns `true` if the point is in front of the far plane and the point is
   * inside the frame. This method is useful for checking if geometry exists at
   * a given 2D coordinate.
   *
   * @param point A 2D point within the frame.
   * @returns `true` if point is in front of far plane.
   */
  public hitTest(point: Point.Point): boolean {
    return this.getNormalizedDepthAtPoint(point) < 1;
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
    const distance = this.getDepthAtPoint(point, fallbackNormalizedDepth);

    const isPerspectiveCamera = this.camera.isPerspective();
    if (isPerspectiveCamera) {
      const { position, viewVector: vv, far } = this.camera;

      // Compute the world position along the ray at the far plane.
      // This is used to determine the angle with the view vector.
      const worldPt = Ray.at(ray, far);
      const eyeToWorldPt = Vector3.subtract(worldPt, position);

      const angle =
        Vector3.dot(vv, eyeToWorldPt) /
        (Vector3.magnitude(vv) * Vector3.magnitude(eyeToWorldPt));
      return Ray.at(ray, distance / angle);
    } else {
      return Ray.at(ray, distance);
    }
  }

  /**
   * Returns the distance from the camera to the given world point.
   *
   * @param worldPt A point in world space to determine the distance to.
   * @returns distance from the camera to the given world point.
   */
  public distanceToPoint(worldPt: Vector3.Vector3): number {
    const { position, direction } = this.camera;

    // Calculate the distance from the camera to the given world point
    // Use the dot product to find the magnitude of the orthogonal component
    const eyeToPoint = Vector3.subtract(worldPt, position);
    return Math.abs(Vector3.dot(eyeToPoint, direction));
  }

  /**
   * Returns the depth of the closest geometry at the point in the
   * viewport (2D) corresponding to the given world point (3D).
   *
   * @param worldPt A point in world space to check.
   * @param viewport A viewport of the viewer.
   * @returns depth of the closest geometry at the corresponding point in the viewport.
   */
  public depthOfClosestGeometry(
    worldPt: Vector3.Vector3,
    viewport: Viewport
  ): number {
    const { projectionViewMatrix } = this.camera;

    // Find the screen point corresponding to the world point for the current camera
    const screenPt = viewport.transformWorldToViewport(
      worldPt,
      projectionViewMatrix
    );
    const scaledPt = viewport.transformPointToFrame(screenPt, this);

    // Find the depth of the closest geometry at the same point on the screen
    return this.getDepthAtPoint(scaledPt);
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
    // Calculate the distance from the camera to the given world point
    const distanceToPoint = this.distanceToPoint(worldPt);

    // Find the depth of the closest geometry at the same point on the screen
    const depthOfClosestGeometry = this.depthOfClosestGeometry(
      worldPt,
      viewport
    );

    // Allow for a small rounding error
    // Note that if the world point is coincident with the geometry,
    // we want to err on the side of returning not occluded
    const allowableDifference = Math.abs(0.02 * distanceToPoint);
    const depthDifference = Math.abs(depthOfClosestGeometry - distanceToPoint);

    return (
      distanceToPoint > depthOfClosestGeometry &&
      depthDifference > allowableDifference
    );
  }

  /**
   * Returns `true` if the given point in world space is detached from geometry.
   *
   * @param worldPt A point in world space to check.
   * @param viewport A viewport of the viewer.
   * @returns `true` if the world point is detached from geometry. `false` otherwise.
   */
  public isDetached(worldPt: Vector3.Vector3, viewport: Viewport): boolean {
    // Calculate the distance from the camera to the given world point
    const distanceToPoint = this.distanceToPoint(worldPt);

    // Find the depth of the closest geometry at the same point on the screen
    const depthOfClosestGeometry = this.depthOfClosestGeometry(
      worldPt,
      viewport
    );

    // If distanceFromClosestGeometryToPoint is 0, then the point is directly on the surface of the
    // closest geometry and is not detached. This method allows for a small rounding
    // error when the point is slightly closer to the camera than the geometry.
    const distanceFromClosestGeometryToPoint =
      depthOfClosestGeometry - distanceToPoint;
    const allowableDifferenceToStillBeOnSurface = 0.02 * distanceToPoint;
    const pointIsOnSurface =
      distanceFromClosestGeometryToPoint <
      allowableDifferenceToStillBeOnSurface;

    // Check to see if the given world point is behind the far plane,
    // or that the depth of the point is greater than the maximum depth of visible geometry
    const maximumDepthOfVisibleGeometry = this.getMaxDepthOfGeometry();
    const pointIsBehindFarPlane =
      distanceToPoint > maximumDepthOfVisibleGeometry;

    const isDetachedFromGeometry = !pointIsOnSurface || pointIsBehindFarPlane;
    return isDetachedFromGeometry;
  }
}
