import { EventEmitter } from '@stencil/core';
import { Point, Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { ReceivedFrame } from '../..';
import { CursorManager } from '../cursors';
import { PerspectiveCamera } from '../scenes';
import { Viewport } from '../types';
import {
  CameraTransform,
  InteractionApi,
  InteractionConfigProvider,
  SceneProvider,
} from './interactionApi';
import { TapEventDetails } from './tapEventDetails';

export class InteractionApiPerspective extends InteractionApi {
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

  public async transformCamera(
    t: CameraTransform<PerspectiveCamera>
  ): Promise<void> {
    if (this.isInteracting()) {
      const scene = this.getScene();
      const viewport = this.getViewport();
      const frame = this.getFrame();
      const depthBuffer = await frame?.depthBuffer();

      this.currentCamera =
        this.currentCamera != null && viewport != null && frame != null
          ? t({
              camera: this.currentCamera as PerspectiveCamera,
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
