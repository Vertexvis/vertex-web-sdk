import { BoundingBox, Plane, Point, Ray, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import { InteractionApi, InteractionHandler } from '../interactions';
import { Camera, CameraRenderOptions } from '../scenes';
import { ViewerTeleportMode, WalkModeModel } from '../walk-mode/model';

export interface AnimationConfiguration {
  durationMs: number;
}

export class TeleportInteractionHandler implements InteractionHandler {
  private api?: InteractionApi;
  private element?: HTMLElement;

  private rectObserver = new ElementRectObserver();

  private downPosition?: Point.Point;
  private downButtons?: number;

  private enabledChangeDisposable?: Disposable;
  private teleportModeChangeDisposable?: Disposable;
  private cursorDisposable?: Disposable;

  public constructor(
    private model: WalkModeModel,
    private animationConfiguration?: AnimationConfiguration
  ) {
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleEnabledChange = this.handleEnabledChange.bind(this);
    this.handleTeleportModeChange = this.handleTeleportModeChange.bind(this);

    this.enabledChangeDisposable = this.model.onEnabledChange(
      this.handleEnabledChange
    );
  }

  public dispose(): void {
    this.disable();
    this.enabledChangeDisposable?.dispose();

    this.element = undefined;
    this.api = undefined;

    this.rectObserver.disconnect();
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.rectObserver.observe(element);

    this.handleEnabledChange(this.model.getEnabled());
  }

  public setAnimations(config?: AnimationConfiguration): void {
    this.animationConfiguration = config;
  }

  public enable(): void {
    this.disable();

    this.teleportModeChangeDisposable = this.model.onTeleportModeChange(
      this.handleTeleportModeChange
    );
    this.element?.addEventListener('pointerdown', this.handlePointerDown);

    this.handleTeleportModeChange(this.model.getTeleportMode());
  }

  public disable(): void {
    this.teleportModeChangeDisposable?.dispose();
    this.cursorDisposable?.dispose();

    this.element?.removeEventListener('pointerdown', this.handlePointerDown);
  }

  private async handlePointerDown(event: PointerEvent): Promise<void> {
    this.downPosition = getMouseClientPosition(event, this.rectObserver.rect);
    this.downButtons = event.buttons;

    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private async handlePointerUp(event: PointerEvent): Promise<void> {
    const mode = this.model.getTeleportMode();
    const threshold = this.api?.pixelThreshold() ?? 2;
    const pt = getMouseClientPosition(event, this.rectObserver.rect);
    const isRightClick = this.downButtons === 2;
    const hasModifier =
      event.shiftKey || event.altKey || event.metaKey || event.ctrlKey;

    if (
      mode != null &&
      this.downPosition != null &&
      Point.distance(this.downPosition, pt) <= threshold &&
      !isRightClick &&
      !hasModifier
    ) {
      const hits = await this.api?.hitItems(pt);
      const hit = hits != null ? hits[0] : undefined;

      if (hit?.hitNormal != null && hit?.hitPoint) {
        await this.beginInteraction();

        await this.api?.transformCamera(({ camera, boundingBox }) => {
          return mode === 'teleport'
            ? this.teleport(
                camera,
                boundingBox,
                hit.hitPoint as Vector3.Vector3
              )
            : this.teleportAndAlign(
                camera,
                boundingBox,
                hit.hitPoint as Vector3.Vector3,
                hit.hitNormal as Vector3.Vector3
              );
        }, this.renderConfiguration());

        await this.endInteraction();
      }
    }

    this.downPosition = undefined;

    window.removeEventListener('pointerup', this.handlePointerUp);
  }

  private async beginInteraction(): Promise<void> {
    if (!this.api?.isInteracting()) {
      await this.api?.beginInteraction();
    }
  }

  private async endInteraction(): Promise<void> {
    await this.api?.endInteraction();
  }

  private teleport(
    camera: Camera,
    boundingBox: BoundingBox.BoundingBox,
    hitPosition: Vector3.Vector3
  ): Camera {
    const shortestBoundingBoxLength = this.shortestLength(boundingBox);
    const heightScalar = this.model.getTeleportHeightScalar();

    const cameraPlane = Plane.fromNormalAndCoplanarPoint(
      camera.up,
      camera.position
    );
    const projectedHitPosition = Plane.projectPoint(cameraPlane, hitPosition);

    const rayToHitPosition = Ray.create({
      origin: camera.position,
      direction: Vector3.normalize(
        Vector3.subtract(projectedHitPosition, camera.position)
      ),
    });
    const distanceToHitPosition = Vector3.distance(
      camera.position,
      projectedHitPosition
    );
    const distanceToLookAt = Vector3.distance(camera.position, camera.lookAt);

    const newPosition = Ray.at(
      rayToHitPosition,
      distanceToHitPosition - shortestBoundingBoxLength / heightScalar
    );
    const newPositionViewVectorRay = Ray.create({
      origin: newPosition,
      direction: Vector3.normalize(camera.viewVector),
    });

    return camera.update({
      position: newPosition,
      lookAt: Ray.at(newPositionViewVectorRay, distanceToLookAt),
    });
  }

  private teleportAndAlign(
    camera: Camera,
    boundingBox: BoundingBox.BoundingBox,
    hitPosition: Vector3.Vector3,
    hitNormal: Vector3.Vector3
  ): Camera {
    const shortestBoundingBoxLength = this.shortestLength(boundingBox);
    const heightScalar = this.model.getTeleportHeightScalar();

    const upRay = Ray.create({
      origin: hitPosition,
      direction: camera.up,
    });

    return camera.alignTo(
      Ray.at(upRay, shortestBoundingBoxLength / heightScalar),
      hitNormal
    );
  }

  private handleEnabledChange(enabled: boolean): void {
    if (enabled) {
      this.enable();
    } else {
      this.disable();
    }
  }

  private handleTeleportModeChange(mode?: ViewerTeleportMode): void {
    if (mode != null) {
      this.cursorDisposable = this.api?.addCursor('crosshair');
    } else {
      this.cursorDisposable?.dispose();
    }
  }

  private shortestLength(boundingBox: BoundingBox.BoundingBox): number {
    return Math.min(...Vector3.toArray(BoundingBox.lengths(boundingBox)));
  }

  private renderConfiguration(): CameraRenderOptions | undefined {
    return this.animationConfiguration != null
      ? { animation: { milliseconds: this.animationConfiguration.durationMs } }
      : undefined;
  }
}
