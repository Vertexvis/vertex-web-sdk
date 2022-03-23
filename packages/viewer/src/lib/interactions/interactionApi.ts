import { EventEmitter } from '@stencil/core';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import {
  Angle,
  BoundingBox,
  Plane,
  Point,
  Ray,
  Vector3,
} from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { Disposable } from '@vertexvis/utils';

import { ReceivedFrame } from '../..';
import { Cursor, CursorManager } from '../cursors';
import { Camera, Scene } from '../scenes';
import {
  DepthBuffer,
  EntityType,
  FrameCameraBase,
  Interactions,
  Viewport,
} from '../types';
import { TapEventDetails, TapEventKeys } from './tapEventDetails';

export type SceneProvider = () => Scene;

export type InteractionConfigProvider = () => Interactions.InteractionConfig;

export type CameraTransform<
  T extends Camera = Camera,
  R extends Camera = Camera
> = (data: {
  camera: T;
  viewport: Viewport;
  scale: Point.Point;
  boundingBox: BoundingBox.BoundingBox;
  frame: ReceivedFrame;
  depthBuffer?: DepthBuffer;
}) => R;

export interface PanData {
  hitPt: Vector3.Vector3;
  hitPlane: Plane.Plane;
  startingCamera: FrameCameraBase;
}

export interface ZoomData {
  hitPt: Vector3.Vector3;
  hitPlane: Plane.Plane;
}

/**
 * The `InteractionApi` provides methods that API developers can use to modify
 * the internal state of an interaction.
 */
export abstract class InteractionApi {
  protected currentCamera?: Camera;
  private lastAngle: Angle.Angle | undefined;
  private worldRotationPoint?: Vector3.Vector3;

  protected panData?: PanData;
  protected zoomData?: ZoomData;

  public constructor(
    protected stream: StreamApi,
    private cursors: CursorManager,
    protected getConfig: InteractionConfigProvider,
    protected getScene: SceneProvider,
    protected getFrame: () => ReceivedFrame | undefined,
    protected getViewport: () => Viewport,
    private tapEmitter: EventEmitter<TapEventDetails>,
    private doubleTapEmitter: EventEmitter<TapEventDetails>,
    private longPressEmitter: EventEmitter<TapEventDetails>,
    private interactionStartedEmitter: EventEmitter<void>,
    private interactionFinishedEmitter: EventEmitter<void>
  ) {
    this.tap = this.tap.bind(this);
    this.doubleTap = this.doubleTap.bind(this);
    this.longPress = this.longPress.bind(this);
    this.emitTapEvent = this.emitTapEvent.bind(this);
  }

  /**
   * Displays a cursor over the viewer with the given priority. Cursors with
   * higher priority will take precedence over cursors with lower priorities if
   * there's more than a single cursor added.
   *
   * @param cursor The cursor to add.
   * @param priority The priority of the cursor.
   * @returns A `Disposable` that can be used to remove the cursor.
   */
  public addCursor(cursor: Cursor, priority?: number): Disposable {
    return this.cursors.add(cursor, priority);
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
      ? viewport.transformPointToWorldSpace(point, depthBuffer, 0.5)
      : undefined;
  }

  /**
   * Returns the entity at the given point in viewport space.
   *
   * @param point A point in viewport space.
   * @returns The entity that was found.
   */
  public async getEntityTypeAtPoint(point: Point.Point): Promise<EntityType> {
    const viewport = this.getViewport();
    const featureMap = await this.getFrame()?.featureMap();

    if (featureMap != null) {
      const framePt = viewport.transformPointToFrame(point, featureMap);
      return featureMap.getEntityType(framePt);
    } else {
      return EntityType.NO_GEOMETRY;
    }
  }

  /**
   * Generates a ray from the given point, in viewport coordinates.
   *
   * @param point A point in viewport coordinates.
   * @returns A ray representing the direction of the point in world
   * coordinates.
   */
  public getRayFromPoint(point: Point.Point): Ray.Ray {
    const viewport = this.getViewport();
    const frame = this.getFrame();

    if (frame != null) {
      return viewport.transformPointToRay(
        point,
        frame.image,
        frame.scene.camera
      );
    } else throw new Error('Cannot get camera. Frame is undefined.');
  }

  /**
   * Emits a tap event with the provided position relative to the viewer
   * canvas, along with the set of modifier keys held (if applicable).
   *
   * @param position An {x, y} coordinate marking the position of the tap.
   * @param keyDetails A set of pressed keyboard keys that you want to include
   *  in the tap event.
   */
  public async tap(
    position: Point.Point,
    keyDetails: Partial<TapEventKeys> = {},
    buttons = 0
  ): Promise<void> {
    this.emitTapEvent(this.tapEmitter.emit, position, keyDetails, buttons);
  }

  public async doubleTap(
    position: Point.Point,
    keyDetails: Partial<TapEventKeys> = {},
    buttons = 0
  ): Promise<void> {
    this.emitTapEvent(
      this.doubleTapEmitter.emit,
      position,
      keyDetails,
      buttons
    );
  }

  public async longPress(
    position: Point.Point,
    keyDetails: Partial<TapEventKeys> = {},
    buttons = 0
  ): Promise<void> {
    this.emitTapEvent(
      this.longPressEmitter.emit,
      position,
      keyDetails,
      buttons
    );
  }

  /**
   * Marks the start of an interaction. This method must be called before
   * performing any additional interaction operations. Use `endInteraction()` to
   * mark the end of an interaction.
   */
  public async beginInteraction(): Promise<void> {
    if (!this.isInteracting()) {
      this.interactionStartedEmitter.emit();
      this.currentCamera = this.getScene().camera();
      await this.stream.beginInteraction();
    }
  }

  /**
   * Invokes a function to transform the scene's camera and request a new image
   * for the updated scene.
   *
   * @param t A function to transform the camera. Function will be passed the
   *  camera and scene viewport and is expected to return an updated camera.
   */
  public async transformCamera(t: CameraTransform): Promise<void> {
    if (this.isInteracting()) {
      const scene = this.getScene();
      const viewport = this.getViewport();
      const frame = this.getFrame();
      const depthBuffer = await frame?.depthBuffer();

      this.currentCamera =
        this.currentCamera != null && viewport != null && frame != null
          ? t({
              camera: this.currentCamera,
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

  /**
   * Performs a twist operation of the scene's camera, and requests a new image
   * for the updated scene.
   *
   * @param delta A position delta `{x, y}` in the 2D coordinate space of the
   *  viewer or the angle to twist the camera by around the view vector.
   */
  public async twistCamera(delta: number): Promise<void>;
  public async twistCamera(delta: Point.Point): Promise<void>;
  public async twistCamera(...args: any[]): Promise<void> {
    return this.transformCamera(({ camera, viewport }) => {
      const axis = Vector3.normalize(
        Vector3.subtract(camera.lookAt, camera.position)
      );

      if (args.length === 1 && typeof args[0] === 'number') {
        const angleInRadians = Angle.toRadians(-args[0]);
        return camera.rotateAroundAxis(angleInRadians, axis);
      } else if (args.length === 1) {
        const center = Point.create(viewport.width / 2, viewport.height / 2);
        const currentAngle = Angle.toDegrees(Angle.fromPoints(center, args[0]));
        const angleDelta =
          this.lastAngle != null ? currentAngle - this.lastAngle : 0;

        this.lastAngle = currentAngle;
        const axis = Vector3.normalize(
          Vector3.subtract(camera.lookAt, camera.position)
        );
        const angleInRadians = Angle.toRadians(-angleDelta);
        return camera.rotateAroundAxis(angleInRadians, axis);
      }
      return camera;
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

        // Create a plane for the hit point that will be used to determine the
        // delta of future mouse movements to the original hit point. Fallback
        // to a plane placed at the look at point, in case there's no hit.
        const hitPt =
          depthBuffer != null
            ? this.getWorldPoint(screenPt, depthBuffer, fallback)
            : fallback;
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
          return camera.update(startingCamera).moveBy(delta);
        }
      }
      return camera;
    });
  }

  /**
   * Performs a view all operation for the scene's bounding box, and requests a
   * new image for the updated scene.
   */
  public async viewAll(): Promise<void> {
    await this.getScene().camera().viewAll().render();
  }

  /**
   * Performs a rotate operation of the scene around the camera's look at point,
   * and requests a new image for the updated scene.
   *
   * @param delta A position delta `{x, y}` in the 2D coordinate space of the
   *  viewer.
   */
  public async rotateCamera(delta: Point.Point): Promise<void> {
    return this.transformCamera(({ camera, viewport }) => {
      const upVector = Vector3.normalize(camera.up);
      const lookAt = Vector3.normalize(
        Vector3.subtract(camera.lookAt, camera.position)
      );

      const crossX = Vector3.cross(upVector, lookAt);
      const crossY = Vector3.cross(lookAt, crossX);

      const mouseToWorld = Vector3.normalize({
        x: delta.x * crossX.x + delta.y * crossY.x,
        y: delta.x * crossX.y + delta.y * crossY.y,
        z: delta.x * crossX.z + delta.y * crossY.z,
      });

      const rotationAxis = Vector3.cross(mouseToWorld, lookAt);

      const epsilonX = (3.0 * Math.PI * delta.x) / viewport.width;
      const epsilonY = (3.0 * Math.PI * delta.y) / viewport.height;
      const angle = Math.abs(epsilonX) + Math.abs(epsilonY);

      return camera.rotateAroundAxis(angle, rotationAxis);
    });
  }

  public async rotateCameraAtPoint(
    delta: Point.Point,
    point: Point.Point
  ): Promise<void> {
    return this.transformCamera(
      ({ camera, viewport, boundingBox, depthBuffer }) => {
        if (this.worldRotationPoint == null) {
          const worldCenter = BoundingBox.center(boundingBox);
          this.worldRotationPoint =
            depthBuffer != null
              ? this.getWorldPoint(point, depthBuffer, worldCenter)
              : camera.lookAt;
        }

        const upVector = Vector3.normalize(camera.up);
        const vv = Vector3.normalize(
          Vector3.subtract(camera.lookAt, camera.position)
        );

        const crossX = Vector3.cross(upVector, vv);
        const crossY = Vector3.cross(vv, crossX);

        const mouseToWorld = Vector3.normalize({
          x: delta.x * crossX.x + delta.y * crossY.x,
          y: delta.x * crossX.y + delta.y * crossY.y,
          z: delta.x * crossX.z + delta.y * crossY.z,
        });

        const rotationAxis = Vector3.cross(mouseToWorld, vv);

        const epsilonX = (3.0 * Math.PI * delta.x) / viewport.width;
        const epsilonY = (3.0 * Math.PI * delta.y) / viewport.height;
        const angle = Math.abs(epsilonX) + Math.abs(epsilonY);

        const updated = camera.rotateAroundAxisAtPoint(
          angle,
          this.worldRotationPoint,
          rotationAxis
        );

        return updated.update({
          // Scale the lookAt point to the same length as the distance to the
          // center of the bounding box to maintain zoom and pan behavior.
          lookAt: Vector3.add(
            Vector3.scale(
              Math.abs(camera.signedDistanceToBoundingBoxCenter()) /
                Vector3.magnitude(updated.viewVector),
              updated.viewVector
            ),
            updated.position
          ),
        });
      }
    );
  }

  /**
   * Performs a zoom operation of the scene's camera, and requests a new image
   * for the updated scene.
   *
   * @param delta The distance to zoom. Positive values zoom in and negative
   *  values zoom out.
   */
  public async zoomCamera(delta: number): Promise<void> {
    return this.transformCamera(({ camera, viewport }) => {
      const vv = camera.viewVector;
      const v = Vector3.normalize(vv);

      const distance = Vector3.magnitude(vv);
      const epsilon = (3 * distance * delta) / viewport.height;

      const position = Vector3.add(camera.position, Vector3.scale(epsilon, v));
      const newCamera = camera.update({ position });
      return newCamera;
    });
  }

  public async zoomCameraToPoint(
    point: Point.Point,
    delta: number
  ): Promise<void> {
    return this.transformCamera(({ camera, viewport, frame, depthBuffer }) => {
      const cam = frame.scene.camera;
      const dir = cam.direction;

      const frameCam = camera.toFrameCamera();
      const ray = viewport.transformPointToRay(point, frame.image, frameCam);

      if (this.zoomData == null) {
        const fallbackPlane = Plane.fromNormalAndCoplanarPoint(dir, cam.lookAt);
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
        const { hitPt, hitPlane } = this.zoomData;
        const distance = Vector3.distance(camera.position, hitPt);
        const epsilon = (6 * distance * delta) / viewport.height;

        const position = Ray.at(ray, epsilon);
        const lookAt = Plane.projectPoint(hitPlane, position);
        const newCamera = camera.update({ position, lookAt });
        const newDistance = Vector3.distance(position, lookAt);

        if (newDistance >= newCamera.near) {
          return newCamera;
        }
      }
      return camera;
    });
  }

  /**
   * Marks the end of an interaction.
   */
  public async endInteraction(): Promise<void> {
    if (this.isInteracting()) {
      this.currentCamera = undefined;
      this.worldRotationPoint = undefined;
      this.panData = undefined;
      this.zoomData = undefined;
      this.resetLastAngle();

      this.interactionFinishedEmitter.emit();
      await this.stream.endInteraction();
    }
  }

  /**
   * resets the last recorded angle for a twist op
   */
  public resetLastAngle(): void {
    this.lastAngle = undefined;
  }

  /**
   * Indicates if the API is in an interacting state.
   */
  public isInteracting(): boolean {
    return this.currentCamera != null;
  }

  /**
   * Returns the pixel threshold that should be used to detect
   * movement based on the type of pointer input being coarse or fine.
   * This threshold is based on the configured `coarsePointerThreshold`
   * or the `finePointerThreshold` respectively.
   *
   * @param isTouch - Whether the event is a touch or not, if false or
   * undefined, a media query will be used to determine pointer type
   * @returns The pixel threshold.
   */
  public pixelThreshold(isTouch?: boolean): number {
    const pixelThreshold = this.isCoarseInputDevice(isTouch)
      ? this.getConfig().coarsePointerThreshold
      : this.getConfig().finePointerThreshold;

    return pixelThreshold * window.devicePixelRatio;
  }

  /**
   * Performs a hit test at the given point and returns a list of hit results
   * indicating any scene items that exist at the given point.
   *
   * @param pt A point, in viewport coordinates.
   * @returns A promise that resolves with the list of hit results.
   */
  public async hitItems(
    pt: Point.Point
  ): Promise<vertexvis.protobuf.stream.IHit[]> {
    const res = await this.getScene().raycaster().hitItems(pt);
    return res?.hits ?? [];
  }

  private emitTapEvent(
    emit: (details: TapEventDetails) => void,
    position: Point.Point,
    keyDetails: Partial<TapEventKeys> = {},
    buttons = 0
  ): void {
    const {
      altKey = false,
      ctrlKey = false,
      metaKey = false,
      shiftKey = false,
    } = keyDetails;
    emit({
      position,
      altKey,
      ctrlKey,
      metaKey,
      shiftKey,
      buttons,
    });
  }

  private isCoarseInputDevice(isTouch?: boolean): boolean {
    return isTouch || window.matchMedia('(pointer: coarse)').matches;
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
      ? viewport.transformPointToWorldSpace(point, depthBuffer)
      : fallbackPoint;
  }

  /**
   * Performs a pan operation of the scene's camera, and requests a new image
   * for the updated scene.
   *
   * @param delta A position delta `{x, y}` in the 2D coordinate space of the
   *  viewer.
   */
  public abstract panCameraByDelta(delta: Point.Point): Promise<void>;
}
