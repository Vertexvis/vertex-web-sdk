import { Dimensions, Point, Vector3 } from '@vertexvis/geometry';
import { EventEmitter } from '@stencil/core';
import { TapEventDetails, TapEventKeys } from './tapEventDetails';
import { StreamApi } from '@vertexvis/stream-api';
import { Scene, Camera } from '../scenes';
import { Interactions } from '../types';

type SceneProvider = () => Scene;

type InteractionConfigProvider = () => Interactions.InteractionConfig;

type CameraTransform = (
  camera: Camera,
  viewport: Dimensions.Dimensions
) => Camera;

/**
 * The `InteractionApi` provides methods that API developers can use to modify
 * the internal state of an interaction.
 */
export class InteractionApi {
  private currentCamera?: Camera;

  public constructor(
    private stream: StreamApi,
    private getConfig: InteractionConfigProvider,
    private getScene: SceneProvider,
    private tapEmitter: EventEmitter<TapEventDetails>,
    private doubleTapEmitter: EventEmitter<TapEventDetails>,
    private longPressEmitter: EventEmitter<TapEventDetails>
  ) {
    this.tap = this.tap.bind(this);
    this.doubleTap = this.doubleTap.bind(this);
    this.longPress = this.longPress.bind(this);
    this.emitTapEvent = this.emitTapEvent.bind(this);
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
    keyDetails: Partial<TapEventKeys> = {}
  ): Promise<void> {
    this.emitTapEvent(this.tapEmitter.emit, position, keyDetails);
  }

  public async doubleTap(
    position: Point.Point,
    keyDetails: Partial<TapEventKeys> = {}
  ): Promise<void> {
    this.emitTapEvent(this.doubleTapEmitter.emit, position, keyDetails);
  }

  public async longPress(
    position: Point.Point,
    keyDetails: Partial<TapEventKeys> = {}
  ): Promise<void> {
    this.emitTapEvent(this.longPressEmitter.emit, position, keyDetails);
  }

  /**
   * Marks the start of an interaction. This method must be called before
   * performing any additional interaction operations. Use `endInteraction()` to
   * mark the end of an interaction.
   */
  public async beginInteraction(): Promise<void> {
    if (!this.isInteracting()) {
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
      this.currentCamera =
        this.currentCamera != null
          ? t(this.currentCamera, scene.viewport())
          : undefined;

      await this.currentCamera?.render();
    }
  }

  /**
   * Performs a pan operation of the scene's camera, and requests a new image
   * for the updated scene.
   *
   * @param delta A position delta `{x, y}` in the 2D coordinate space of the
   *  viewer.
   */
  public async panCamera(delta: Point.Point): Promise<void> {
    return this.transformCamera((camera, viewport) => {
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
    return this.transformCamera((camera, viewport) => {
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

  /**
   * Performs a zoom operation of the scene's camera, and requests a new image
   * for the updated scene.
   *
   * @param delta The distance to zoom. Positive values zoom in and negative
   *  values zoom out.
   */
  public async zoomCamera(delta: number): Promise<void> {
    return this.transformCamera((camera, viewport) => {
      const vv = camera.viewVector();
      const v = Vector3.normalize(vv);

      const distance = Vector3.magnitude(vv);
      const epsilon = (3 * distance * delta) / viewport.height;

      const position = Vector3.add(camera.position, Vector3.scale(epsilon, v));
      return camera.update({ position });
    });
  }

  /**
   * Marks the end of an interaction.
   */
  public async endInteraction(): Promise<void> {
    if (this.isInteracting()) {
      this.currentCamera = undefined;
      await this.stream.endInteraction();
    }
  }

  /**
   * Indicates if the API is in an interacting state.
   */
  public isInteracting(): boolean {
    return this.currentCamera != null;
  }

  /**
   * Scales the provided `pixelThreshold` by the device's pixel ratio
   * and the configured `coarsePointerThresholdScale` value if the
   * primary pointer input is coarse (touch).
   *
   * Scales the provided `pixelThreshold` by the configured
   * `finePointerThresholdScale` value if the primary pointer input is
   * fine (mouse).
   *
   * @param pixelThreshold - The pixel threshold to scale.
   * @returns The scaled pixel threshold.
   */
  public scalePixelThreshold(
    pixelThreshold: number,
    isTouch?: boolean
  ): number {
    if (this.isCoarseInputDevice(isTouch)) {
      return (
        pixelThreshold *
        window.devicePixelRatio *
        this.getConfig().coarsePointerThresholdScale
      );
    } else {
      return pixelThreshold * this.getConfig().finePointerThresholdScale;
    }
  }

  private emitTapEvent(
    emit: (details: TapEventDetails) => void,
    position: Point.Point,
    keyDetails: Partial<TapEventKeys> = {}
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
    });
  }

  private isCoarseInputDevice(isTouch?: boolean): boolean {
    return isTouch || window.matchMedia('(pointer: coarse)').matches;
  }
}
