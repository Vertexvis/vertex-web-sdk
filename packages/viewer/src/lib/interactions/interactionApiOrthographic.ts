import { EventEmitter } from '@stencil/core';
import {
  BoundingSphere,
  Plane,
  Point,
  Ray,
  Vector3,
} from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { ReceivedFrame } from '../..';
import { CursorManager } from '../cursors';
import { OrthographicCamera } from '../scenes';
import { DepthBuffer, Viewport } from '../types';
import { ZoomData } from './interactionApi';
import {
  InteractionApi,
  InteractionConfigProvider,
  SceneProvider,
} from './interactionApi';
import { TapEventDetails } from './tapEventDetails';

interface OrthographicZoomData extends ZoomData {
  startingScreenPt: Point.Point;
}

export class InteractionApiOrthographic extends InteractionApi<OrthographicCamera> {
  private orthographicZoomData?: OrthographicZoomData;

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
   * Returns a 3D point in world space for the given 2D point in viewport space.
   *
   * @param point A point in 2D viewport space to transform.
   * @returns A 3D point in world space.
   */
  public async getWorldPointFromViewport(
    point: Point.Point
  ): Promise<Vector3.Vector3 | undefined> {
    const viewport = this.getViewport();
    const frame = this.getFrame();

    if (frame == null) {
      throw new Error('Cannot get world point. Frame is undefined.');
    }

    const depthBuffer = await frame.depthBuffer();
    return depthBuffer != null
      ? viewport.transformPointToOrthographicWorldSpace(point, depthBuffer, 0.5)
      : undefined;
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
      const viewVector = camera.viewVector;
      const normalizedUpVector = Vector3.normalize(camera.up);
      const normalizedViewVector = Vector3.normalize(viewVector);

      const throttledDelta = Point.scale(delta, 0.5, 0.5);
      const d = Vector3.magnitude(viewVector);
      const epsilonX = (throttledDelta.x * d) / viewport.width;
      const epsilonY = (throttledDelta.y * d) / viewport.height;

      const xvec = Vector3.cross(normalizedUpVector, normalizedViewVector);
      const yvec = Vector3.cross(normalizedViewVector, xvec);
      const offset = Vector3.add(
        Vector3.scale(epsilonX, xvec),
        Vector3.scale(epsilonY, yvec)
      );

      return camera.moveBy(offset);
    });
  }

  /**
   * Moves the camera's position and look at to the given screen coordinate.
   *
   * If the screen coordinate intersects with an object, the camera will track
   * the hit point so the mouse position is always under the mouse.
   *
   * If the screen coordinate doesn't intersect with an object, then ???.
   *
   * @param screenPt A point in screen coordinates.
   */
  public async panCameraToScreenPoint(screenPt: Point.Point): Promise<void> {
    return this.transformCamera(({ camera, frame, viewport, boundingBox }) => {
      console.log('panCameraToScreenPoint');
      // Capture the starting state of the pan.
      if (this.panData == null) {
        const startingCamera = camera.toFrameCamera();
        const direction = startingCamera.direction;

        const ray = viewport.transformPointToOrthographicRay(
          screenPt,
          frame.image,
          startingCamera
        );
        const hitPlane = Plane.fromNormalAndCoplanarPoint(
          direction,
          camera.lookAt
        );
        const hitPt = Ray.intersectPlane(ray, hitPlane);
        if (hitPt == null) {
          console.warn(
            'Cannot determine fallback for pan. Ray does not intersect plane.'
          );
          return camera;
        }

        this.panData = { hitPt, hitPlane, startingCamera };
      }

      if (this.panData != null) {
        const { hitPt, hitPlane, startingCamera } = this.panData;

        // Use a ray that originates at the screen and intersects with the hit
        // plane to determine the move distance.
        const ray = viewport.transformPointToOrthographicRay(
          screenPt,
          frame.image,
          startingCamera
        );
        const movePt = Ray.intersectPlane(ray, hitPlane);

        if (movePt != null) {
          const delta = Vector3.subtract(hitPt, movePt);

          // rotationPoint should match lookAt after a pan interaction
          const updatedLookAt = Vector3.add(startingCamera.lookAt, delta);
          return camera.update({
            lookAt: updatedLookAt,
            rotationPoint: updatedLookAt,
          });
        }
      }
      return camera;
    });
  }

  public async zoomCameraToPoint(
    point: Point.Point,
    delta: number
  ): Promise<void> {
    return this.transformCamera(
      ({ camera, viewport, frame, depthBuffer, boundingBox }) => {
        if (
          this.orthographicZoomData == null ||
          Point.distance(point, this.orthographicZoomData.startingScreenPt) > 2
        ) {
          const frameCam = camera.toFrameCamera();
          const dir = frameCam.direction;
          const ray = viewport.transformPointToOrthographicRay(
            point,
            frame.image,
            frameCam
          );

          const fallbackPlane = Plane.fromNormalAndCoplanarPoint(
            dir,
            frameCam.lookAt
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
          this.orthographicZoomData = {
            hitPt,
            hitPlane,
            startingScreenPt: point,
          };
        }

        if (this.orthographicZoomData != null) {
          const { hitPt, hitPlane } = this.orthographicZoomData;

          // The 4 multiplier was chosen to match the desired zoom speed
          const relativeDelta =
            4 * (camera.fovHeight / viewport.height) * delta;
          const fovHeight = Math.max(1, camera.fovHeight - relativeDelta);
          const projectedLookAt = Plane.projectPoint(hitPlane, camera.lookAt);
          const diff = Vector3.scale(
            (camera.fovHeight - fovHeight) / camera.fovHeight,
            Vector3.subtract(hitPt, projectedLookAt)
          );

          // rotationPoint should match lookAt after a zoom interaction
          const updatedLookAt = Vector3.add(camera.lookAt, diff);
          return camera.update({
            lookAt: updatedLookAt,
            rotationPoint: updatedLookAt,
            fovHeight: Math.max(1, camera.fovHeight - relativeDelta),
          });
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

      const rotationAxisDirection = Vector3.cross(
        mouseToWorld,
        directionVector
      );

      // The 9.5 multiplier was chosen to match the desired rotation speed
      const epsilonX = (9.5 * delta.x) / viewport.width;
      const epsilonY = (9.5 * delta.y) / viewport.height;
      const angle = Math.abs(epsilonX) + Math.abs(epsilonY);

      const rotationPoint =
        camera.rotationPoint != null && camera.rotationPoint?.x != null
          ? camera.rotationPoint
          : camera.lookAt;
      const updated = camera.rotateAroundAxisAtPoint(
        angle,
        rotationPoint,
        rotationAxisDirection
      );

      // Update the lookAt point to take the center of the model into account
      const updatedCenterPoint = Vector3.subtract(
        BoundingSphere.create(boundingBox).center,
        updated.lookAt
      );
      const orthogonalOffset = Vector3.dot(
        updated.viewVector,
        updatedCenterPoint
      );
      const viewVectorMagnitudeSquared = Vector3.magnitudeSquared(
        updated.viewVector
      );
      const offset = orthogonalOffset / viewVectorMagnitudeSquared;

      const scaledViewVector = Vector3.scale(offset, updated.viewVector);
      const newLookAt = Vector3.add(scaledViewVector, updated.lookAt);

      // Update only the lookAt point. The rotationPoint should remain
      // constant until a different type of interaction is performed.
      return updated.update({
        lookAt: newLookAt,
      });
    });
  }

  protected getWorldPoint(
    point: Point.Point,
    depthBuffer: DepthBuffer,
    fallbackPoint: Vector3.Vector3
  ): Vector3.Vector3 {
    const viewport = this.getViewport();
    const framePt = viewport.transformPointToFrame(point, depthBuffer);
    const hasDepth = depthBuffer.hitTest(framePt);
    return hasDepth
      ? viewport.transformPointToOrthographicWorldSpace(point, depthBuffer)
      : fallbackPoint;
  }
}
