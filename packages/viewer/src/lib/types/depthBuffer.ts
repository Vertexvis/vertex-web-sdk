import { Dimensions, Point, Rectangle } from '@vertexvis/geometry';
import { Vector3 } from '@vertexvis/geometry';
import type { IDecodedPNG } from 'fast-png';
import { Camera } from '../scenes/camera';
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
export class DepthBuffer {
  /**
   * A constant that specifies the maximum depth value that can be represented
   * by a depth buffer.
   */
  public static MAX_DEPTH_VALUE = 2 ** 16 - 1;

  /**
   * Constructs a new depth buffer.
   *
   * @param depthDimensions The dimensions of the depth image.
   * @param imageRect The placement of the depth image within the viewport.
   * @param imageScaleFactor The scale factor of the depth image.
   * @param data A 16-bit typed array of depth values.
   */
  public constructor(
    public readonly depthDimensions: Dimensions.Dimensions,
    public readonly imageRect: Rectangle.Rectangle,
    public readonly imageScaleFactor: number,
    public readonly data: Uint16Array
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
    imageRect: Rectangle.Rectangle,
    imageScaleFactor: number
  ): DepthBuffer {
    if (png.data instanceof Uint16Array) {
      return new DepthBuffer(
        Dimensions.create(png.width, png.height),
        imageRect,
        imageScaleFactor,
        png.data
      );
    } else {
      throw new Error('Expected depth PNG to have depth of 16-bit');
    }
  }

  /**
   * Computes the depth from a 2D point within the viewport. The returned value
   * is normalized between 0 and 1.
   *
   * @param point A 2D point within the viewport.
   * @returns A depth between 0 and 1.
   */
  public getDepthAtViewportPoint(
    point: Point.Point,
    clippingPlanes: Pick<Camera, 'near' | 'far'>
  ): number {
    const { near, far } = clippingPlanes;
    const depth = this.getDepth(point);
    return depth * (far - near) + near;
  }

  /**
   * Returns `true` if the given point in world space is occluded by any
   * geometry.
   *
   * @param viewport A viewport of the viewer.
   * @param worldPt A point in world space to check.
   * @param camera The camera used to generate this depth buffer.
   * @returns `true` if the world point is occluded. `false` otherwise.
   */
  public isOccluded(
    viewport: Viewport,
    worldPt: Vector3.Vector3,
    camera: Pick<
      Camera,
      'position' | 'projectionViewMatrix' | 'direction' | 'near' | 'far'
    >
  ): boolean {
    const { position, direction, projectionViewMatrix } = camera;

    const eyeToPoint = Vector3.subtract(worldPt, position);
    const projected = Vector3.project(eyeToPoint, direction);
    const distance = Vector3.magnitude(projected);

    const ndc = Vector3.transformMatrix(worldPt, projectionViewMatrix);
    const screenPt = viewport.transformPoint(ndc);
    const normalizedDepth = this.getDepthAtViewportPoint(screenPt, camera);

    return distance > normalizedDepth;
  }

  private getDepth(point: Point.Point): number {
    const { width, height } = this.depthDimensions;

    const offset = Point.subtract(point, this.imageRect);
    const scale = 1 / this.imageScaleFactor;
    const pixel = Point.scale(offset, scale, scale);

    if (pixel.x >= 1 && pixel.y >= 1 && pixel.x <= width && pixel.y <= height) {
      const index = Math.floor(pixel.x) - 1 + (Math.floor(pixel.y) - 1) * width;
      const depth = this.data[index];
      return (
        (depth || DepthBuffer.MAX_DEPTH_VALUE) / DepthBuffer.MAX_DEPTH_VALUE
      );
    } else {
      return 1;
    }
  }
}
