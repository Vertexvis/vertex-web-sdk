import {
  Angle,
  BoundingBox,
  Plane,
  Point,
  Ray,
  Vector3,
} from '@vertexvis/geometry';
import { EventEmitter } from '@stencil/core';
import { TapEventDetails, TapEventKeys } from './tapEventDetails';
import { StreamApi } from '@vertexvis/stream-api';
import { Scene, Camera } from '../scenes';
import {
  DepthBuffer,
  FramePerspectiveCamera,
  Interactions,
  Viewport,
} from '../types';
import { ReceivedFrame } from '../..';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

type SceneProvider = () => Scene;

type InteractionConfigProvider = () => Interactions.InteractionConfig;

type CameraTransform = (data: {
  camera: Camera;
  viewport: Viewport;
  scale: Point.Point;
  boundingBox: BoundingBox.BoundingBox;
  frame: ReceivedFrame;
  depthBuffer?: DepthBuffer;
}) => Camera;

interface PanData {
  hitPt: Vector3.Vector3;
  hitPlane: Plane.Plane;
  startingCamera: FramePerspectiveCamera;
}

interface ZoomData {
  hitPt: Vector3.Vector3;
  hitPlane: Plane.Plane;
}

/**
 * The `InteractionApi` provides methods that API developers can use to modify
 * the internal state of an interaction.
 */
export class InteractionApi {
  private currentCamera?: Camera;
  private lastAngle: Angle.Angle | undefined;
  private worldRotationPoint?: Vector3.Vector3;

  private panData?: PanData;
  private zoomData?: ZoomData;

  public constructor(
    private stream: StreamApi,
    private getConfig: InteractionConfigProvider,
    private getScene: SceneProvider,
    private getFrame: () => ReceivedFrame | undefined,
    private getViewport: () => Viewport,
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
        const currentAngle = Angle.fromPointsInDegrees(center, args[0]);
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
   * Performs a pan operation of the scene's camera, and requests a new image
   * for the updated scene.
   *
   * @param delta A position delta `{x, y}` in the 2D coordinate space of the
   *  viewer.
   */
  public async panCameraByDelta(delta: Point.Point): Promise<void> {
    return this.transformCamera(({ camera, viewport }) => {
      const vv = camera.viewVector();

      const u = Vector3.normalize(camera.up);
      const v = Vector3.normalize(vv);

      const d = Vector3.magnitude(vv) * Math.tan(camera.fovY);
      const epsilonX = (delta.x * d) / viewport.width;
      const epsilonY = (delta.y / viewport.width) * d;

      const xvec = Vector3.cross(u, v);
      const yvec = Vector3.cross(v, xvec);

      const offset = Vector3.add(
        Vector3.scale(epsilonX, xvec),
        Vector3.scale(epsilonY, yvec)
      );

      return camera.moveBy(offset);
    });
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
              camera.distanceToBoundingBoxCenter() /
                Vector3.magnitude(updated.viewVector()),
              updated.viewVector()
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
      const vv = camera.viewVector();
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

  private getWorldPoint(
    point: Point.Point,
    depthBuffer: DepthBuffer,
    fallbackPoint: Vector3.Vector3
  ): Vector3.Vector3 {
    const viewport = this.getViewport();
    const framePt = viewport.transformPointToFrame(point, depthBuffer);
    const hasDepth = depthBuffer.isDepthAtFarPlane(framePt);
    return hasDepth
      ? viewport.transformPointToWorldSpace(point, depthBuffer)
      : fallbackPoint;
  }
}
