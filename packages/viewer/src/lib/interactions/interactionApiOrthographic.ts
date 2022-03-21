import { EventEmitter } from '@stencil/core';
import {
  BoundingBox,
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
import {
  CameraTransform,
  InteractionApi,
  InteractionConfigProvider,
  SceneProvider,
} from './interactionApi';
import { TapEventDetails } from './tapEventDetails';

export class InteractionApiOrthographic extends InteractionApi {
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
      const viewVector = camera.viewVector;
      const normalizedUpVector = Vector3.normalize(camera.up);
      const normalizedViewVector = Vector3.normalize(viewVector);

      const d = Vector3.magnitude(viewVector) * Math.tan(camera.fovHeight);
      const epsilonX = (delta.x * d) / viewport.width;
      const epsilonY = (delta.y / viewport.width) * d;

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
    return this.transformCamera(({ camera, frame, viewport, depthBuffer }) => {
      // Capture the starting state of the pan.
      if (this.panData == null) {
        const startingCamera = camera.toFrameCamera();
        const direction = startingCamera.direction;

        const ray = viewport.transformPointToRay(
          screenPt,
          frame.image,
          startingCamera
        );
        const fallbackPlane = Plane.fromNormalAndCoplanarPoint(
          direction,
          camera.lookAt
        );
        const fallback = Ray.intersectPlane(ray, fallbackPlane);
        if (fallback == null) {
          console.warn(
            'Cannot determine fallback for pan. Ray does not intersect plane.'
          );
          return camera;
        }

        // TODO: properly support depth buffer in orthographic
        const hitPt = fallback;
        // Create a plane for the hit point that will be used to determine the
        // delta of future mouse movements to the original hit point. Fallback
        // to a plane placed at the look at point, in case there's no hit.
        // const hitPt =
        //   depthBuffer != null
        //     ? this.getWorldPoint(screenPt, depthBuffer, fallback)
        //     : fallback;
        const hitPlane = Plane.fromNormalAndCoplanarPoint(direction, hitPt);

        this.panData = { hitPt, hitPlane, startingCamera };
      }

      if (this.panData != null) {
        const { hitPt, hitPlane, startingCamera } = this.panData;

        // Use a ray that originates at the screen and intersects with the hit
        // plane to determine the move distance.
        const ray = viewport.transformPointToRay(
          screenPt,
          frame.image,
          startingCamera
        );
        const movePt = Ray.intersectPlane(ray, hitPlane);

        if (movePt != null) {
          const delta = Vector3.subtract(hitPt, movePt);
          const boundingSphere = BoundingSphere.create(frame.scene.boundingBox);
          const relativeDelta = Vector3.scale(
            ((boundingSphere.radius * 2) / viewport.width) * camera.aspectRatio,
            delta
          );

          return camera.update({
            lookAt: Vector3.add(startingCamera.lookAt, relativeDelta),
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
    return this.transformCamera(({ camera, viewport, frame, depthBuffer }) => {
      // const cam = frame.scene.camera;
      // const dir = cam.direction;

      // const frameCam = camera.toFrameCamera();
      // const ray = viewport.transformPointToRay(point, frame.image, frameCam);

      // console.log('orthographic ray', ray);

      // if (this.zoomData == null) {
      //   const fallbackPlane = Plane.fromNormalAndCoplanarPoint(dir, cam.lookAt);
      //   const fallbackPt = Ray.intersectPlane(ray, fallbackPlane);
      //   if (fallbackPt == null) {
      //     console.warn(
      //       'Cannot determine fallback point for zoom. Ray does not intersect plane.'
      //     );
      //     return camera;
      //   }

      //   // TODO: properly support depth buffer in orthographic
      //   const hitPt = fallbackPt;
      //   // depthBuffer != null
      //   //   ? this.getWorldPoint(point, depthBuffer, fallbackPt)
      //   //   : fallbackPt;
      //   const hitPlane = Plane.fromNormalAndCoplanarPoint(dir, hitPt);
      //   this.zoomData = { hitPt, hitPlane };
      // }

      // if (this.zoomData != null) {
      //   const { hitPt, hitPlane } = this.zoomData;
      //   const distance = Vector3.distance(camera.position, hitPt);
      //   const epsilon = (6 * distance * delta) / viewport.height;
      //   const boundingBoxCenter = BoundingBox.center(frame.scene.boundingBox);
      //   const centerToBoundingPlane = Vector3.subtract(
      //     frame.scene.boundingBox.max,
      //     boundingBoxCenter
      //   );
      //   const radius = Vector3.magnitude(centerToBoundingPlane);

      //   const position = Ray.at(ray, epsilon);
      //   const lookAt = Plane.projectPoint(hitPlane, position);
      //   const scale =
      //     radius / Vector3.magnitude(Vector3.subtract(lookAt, position));
      //   const newCamera = camera.update({
      //     // lookAt: Vector3.add(lookAt, Vector3.scale(epsilon, lookAt)),
      //     viewVector: Vector3.scale(scale, Vector3.subtract(lookAt, position)),
      //     fovHeight: Math.max(1, camera.fovHeight - epsilon),
      //   });
      //   // const newDistance = Vector3.distance(camera.position, lookAt);

      //   // if (newDistance >= newCamera.near) {
      //   return newCamera;
      //   // }
      // }
      // return camera;

      // const boundingBoxCenter = BoundingBox.center(frame.scene.boundingBox);
      // const centerToBoundingPlane = Vector3.subtract(
      //   frame.scene.boundingBox.max,
      //   boundingBoxCenter
      // );
      // const radius = Vector3.magnitude(centerToBoundingPlane);
      // const diameter = radius * 2;

      // const deltaPoint = Vector3.create(
      //   (point.x / viewport.width) * diameter,
      //   (point.y / viewport.height) * diameter,
      //   camera.far
      // );

      // viewport.transformPointToWorldSpace(point, depthBuffer, camera.far);

      // const lookAt = Vector3.add(camera.lookAt, deltaPoint);

      const relativeDelta = 2 * (camera.fovHeight / viewport.height) * delta;

      return camera.update({
        fovHeight: Math.max(1, camera.fovHeight - relativeDelta),
      });
    });
  }

  public async transformCamera(
    t: CameraTransform<OrthographicCamera>
  ): Promise<void> {
    if (this.isInteracting()) {
      const scene = this.getScene();
      const viewport = this.getViewport();
      const frame = this.getFrame();
      const depthBuffer = await frame?.depthBuffer();

      this.currentCamera =
        this.currentCamera != null && viewport != null && frame != null
          ? t({
              camera: this.currentCamera as OrthographicCamera,
              viewport,
              scale: scene.scale(),
              boundingBox: scene.boundingBox(),
              frame,
              depthBuffer,
            })
          : undefined;

      await this.currentCamera?.render();
    }
  }
}
