import { EventEmitter } from '@stencil/core';
import { BoundingBox, Plane, Point, Ray, Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { ReceivedFrame } from '../..';
import { CursorManager } from '../cursors';
import { PerspectiveCamera } from '../scenes';
import { Viewport } from '../types';
import {
  InteractionApi,
  InteractionConfigProvider,
  SceneProvider,
  ZoomData,
} from './interactionApi';
import { TapEventDetails } from './tapEventDetails';

interface ZoomPositionData {
  position: Vector3.Vector3;
  distance: number;
  isPastHitPlane: boolean;
  keepCurrent: boolean;
}

const CAMERA_MIN_ZOOM_SCALAR = 0.2;

export class InteractionApiPerspective extends InteractionApi<PerspectiveCamera> {
  public constructor(
    stream: StreamApi,
    cursors: CursorManager,
    getConfig: InteractionConfigProvider,
    getScene: SceneProvider,
    getFrame: () => ReceivedFrame | undefined,
    getViewport: () => Viewport,
    tapEmitter: EventEmitter<TapEventDetails>,
    doubleTapEmitter: EventEmitter<TapEventDetails>,
    longPressEmitter: EventEmitter<TapEventDetails>,
    interactionStartedEmitter: EventEmitter<void>,
    interactionFinishedEmitter: EventEmitter<void>
  ) {
    super(
      stream,
      cursors,
      getConfig,
      getScene,
      getFrame,
      getViewport,
      tapEmitter,
      doubleTapEmitter,
      longPressEmitter,
      interactionStartedEmitter,
      interactionFinishedEmitter
    );
  }

  /**
   * Performs a pan operation of the scene's camera, and requests a new image
   * for the updated scene.
   *
   * @param delta A position delta `{x, y}` in the 2D coordinate space of the
   *  viewer.
   */
  public async panCameraByDelta(delta: Point.Point): Promise<void> {
    return this.transformCamera(({ camera, viewport }) => {
      const vv = camera.viewVector;

      const u = Vector3.normalize(camera.up);
      const v = Vector3.normalize(vv);

      const throttledDelta = Point.scale(delta, 0.25, 0.25);
      const d = Vector3.magnitude(vv) * Math.tan(camera.fovY ?? 45);
      const epsilonX = (throttledDelta.x * d) / viewport.width;
      const epsilonY = (throttledDelta.y / viewport.width) * d;

      const xvec = Vector3.cross(u, v);
      const yvec = Vector3.cross(v, xvec);

      const offset = Vector3.add(
        Vector3.scale(epsilonX, xvec),
        Vector3.scale(epsilonY, yvec)
      );

      return camera.moveBy(offset);
    });
  }

  public async zoomCameraToPoint(
    point: Point.Point,
    delta: number
  ): Promise<void> {
    return this.transformCamera(
      ({ camera, viewport, frame, depthBuffer, boundingBox }) => {
        const cam = frame.scene.camera;
        const dir = cam.direction;

        const frameCam = camera.toFrameCamera();
        const ray = viewport.transformPointToRay(point, frame.image, frameCam);

        if (this.zoomData == null) {
          const fallbackPlane = Plane.fromNormalAndCoplanarPoint(
            dir,
            cam.lookAt
          );
          const fallbackPt = Ray.intersectPlane(ray, fallbackPlane);
          if (fallbackPt == null) {
            console.warn(
              'Cannot determine fallback point for zoom. Ray does not intersect plane.'
            );
            return camera;
          }

          const hitPt =
            depthBuffer != null
              ? this.getWorldPoint(point, depthBuffer, fallbackPt)
              : fallbackPt;
          const hitPlane = Plane.fromNormalAndCoplanarPoint(dir, hitPt);
          this.zoomData = { hitPt, hitPlane };
        }

        if (this.zoomData != null) {
          const { hitPlane } = this.zoomData;
          const { position, distance, isPastHitPlane, keepCurrent } =
            this.computeZoomDistances(
              delta,
              camera,
              viewport,
              boundingBox,
              ray,
              this.zoomData
            );

          if (isPastHitPlane && !keepCurrent) {
            const viewVectorRay = Ray.create({
              origin: position,
              direction: Vector3.normalize(camera.viewVector),
            });

            return camera.update({
              position,
              lookAt: Ray.at(viewVectorRay, distance),
            });
          } else if (!keepCurrent) {
            return camera.update({
              position,
              lookAt: Plane.projectPoint(hitPlane, position),
            });
          }
        }
        return camera;
      }
    );
  }

  /**
   * Performs a rotate operation of the scene around the camera's look at point,
   * and requests a new image for the updated scene.
   *
   * @param delta A position delta `{x, y}` in the 2D coordinate space of the
   *  viewer.
   */
  public async rotateCamera(delta: Point.Point): Promise<void> {
    return this.transformCamera(({ camera, viewport, boundingBox }) => {
      console.log('rotateCamera for perspective');

      const upVector = Vector3.normalize(camera.up);
      const directionVector = Vector3.normalize(
        Vector3.subtract(camera.lookAt, camera.position)
      );
      const crossX = Vector3.cross(upVector, directionVector);
      const crossY = Vector3.cross(directionVector, crossX);

      const mouseToWorld = Vector3.normalize({
        x: delta.x * crossX.x + delta.y * crossY.x,
        y: delta.x * crossX.y + delta.y * crossY.y,
        z: delta.x * crossX.z + delta.y * crossY.z,
      });

      const rotationAxis = Vector3.cross(mouseToWorld, directionVector);

      // The 9.5 multiplier was chosen to match the desired rotation speed
      const epsilonX = (9.5 * delta.x) / viewport.width;
      const epsilonY = (9.5 * delta.y) / viewport.height;
      const angle = Math.abs(epsilonX) + Math.abs(epsilonY);

      return camera.rotateAroundAxis(angle, rotationAxis);
    });
  }

  public walk(delta: Vector3.Vector3): void {
    this.transformCamera(({ camera, boundingBox }) => {
      const { position, up, lookAt } = camera;

      const normalizedUp = Vector3.normalize(up);
      const normalizedViewVector = Vector3.normalize(camera.viewVector);

      const boundingBoxScalar = Math.min(
        ...Vector3.toArray(BoundingBox.lengths(boundingBox))
      );
      const scaledDelta = Vector3.scale(boundingBoxScalar, delta);
      const localX = Vector3.cross(normalizedUp, normalizedViewVector);
      const localZ = Vector3.cross(localX, normalizedUp);

      const translationX = Vector3.scale(
        scaledDelta.x,
        Vector3.normalize(localX)
      );
      const translationY = Vector3.scale(
        scaledDelta.y,
        Vector3.normalize(normalizedUp)
      );
      const translationZ = Vector3.scale(
        scaledDelta.z,
        Vector3.normalize(localZ)
      );
      const translation = Vector3.negate(
        Vector3.add(translationX, translationY, translationZ)
      );

      return camera.update({
        ...camera,
        position: Vector3.add(position, translation),
        lookAt: Vector3.add(lookAt, translation),
      });
    });
  }

  private computeZoomDistances(
    delta: number,
    camera: PerspectiveCamera,
    viewport: Viewport,
    boundingBox: BoundingBox.BoundingBox,
    pointRay: Ray.Ray,
    zoomData: ZoomData
  ): ZoomPositionData {
    const config = this.getConfig();
    const { hitPt, hitPlane } = zoomData;
    const minDistance = config.useMinimumPerspectiveZoomDistance
      ? this.computeZoomMinimumDistance(camera, boundingBox)
      : -1;
    const expectedDistance = Vector3.distance(camera.position, hitPt);
    const actualDistance = Math.max(minDistance, expectedDistance);
    const epsilon = (6 * actualDistance * delta) / viewport.height;

    const expectedPosition = Ray.at(pointRay, epsilon);
    const expectedViewVector = Ray.create({
      origin: expectedPosition,
      direction: Vector3.normalize(camera.viewVector),
    });
    const expectedIntersection = Ray.intersectPlane(
      expectedViewVector,
      hitPlane
    );

    if (
      expectedIntersection == null &&
      config.useMinimumPerspectiveZoomDistance
    ) {
      const minDistanceEpsilon = (6 * minDistance * delta) / viewport.height;
      const position = Ray.at(pointRay, minDistanceEpsilon);

      return {
        position,
        distance: minDistance,
        isPastHitPlane: true,
        keepCurrent: false,
      };
    } else if (expectedIntersection == null) {
      return {
        position: camera.position,
        distance: actualDistance,
        isPastHitPlane: true,
        keepCurrent: true,
      };
    }

    return {
      position: expectedPosition,
      distance: actualDistance,
      isPastHitPlane: false,
      keepCurrent: false,
    };
  }

  private computeZoomMinimumDistance(
    camera: PerspectiveCamera,
    boundingBox: BoundingBox.BoundingBox
  ): number {
    const xLength = Math.abs(boundingBox.min.x) + Math.abs(boundingBox.max.x);
    const yLength = Math.abs(boundingBox.min.y) + Math.abs(boundingBox.max.y);
    const zLength = Math.abs(boundingBox.min.z) + Math.abs(boundingBox.max.z);
    const maxLength = Math.max(xLength, yLength, zLength);

    const absDotX = Math.abs(
      Vector3.dot(Vector3.normalize(camera.viewVector), Vector3.right())
    );
    const absDotY = Math.abs(
      Vector3.dot(Vector3.normalize(camera.viewVector), Vector3.up())
    );
    const absDotZ = Math.abs(
      Vector3.dot(Vector3.normalize(camera.viewVector), Vector3.back())
    );

    const scaledLengthX = xLength * absDotX;
    const scaledLengthY = yLength * absDotY;
    const scaledLengthZ = zLength * absDotZ;

    const relevanceLengthX = maxLength / xLength;
    const relevanceLengthY = maxLength / yLength;
    const relevanceLengthZ = maxLength / zLength;

    return (
      ((scaledLengthX + scaledLengthY + scaledLengthZ) /
        (relevanceLengthX + relevanceLengthY + relevanceLengthZ)) *
      CAMERA_MIN_ZOOM_SCALAR
    );
  }
}
