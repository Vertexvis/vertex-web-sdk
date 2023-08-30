import { BoundingBox, Plane, Point, Ray, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import {
  CameraTransform,
  InteractionApi,
  InteractionHandler,
} from '../interactions';
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
    const point = getMouseClientPosition(event, this.rectObserver.rect);
    const isRightClick = this.downButtons === 2;
    const hasModifier =
      event.shiftKey || event.altKey || event.metaKey || event.ctrlKey;

    if (
      mode != null &&
      this.downPosition != null &&
      Point.distance(this.downPosition, point) <= threshold &&
      !isRightClick &&
      !hasModifier
    ) {
      switch (mode) {
        case 'teleport':
          return this.teleportToHit(point);
        case 'teleport-toward':
          return this.teleportTowardHit(point);
        case 'teleport-and-align':
          return this.teleportAndAlign(point);
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

  private async teleportTowardHit(point: Point.Point): Promise<void> {
    const worldPoint = await this.api?.getWorldPointFromViewport(point);
    const mouseRay = this.api?.getRayFromPoint(point);

    if (mouseRay != null) {
      const { teleportDistancePercentage, teleportCollisionDistance } =
        this.model.getConfiguration();
      const teleportDistanceScalar = teleportDistancePercentage / 100;

      return this.performInteraction(({ camera, boundingBox }) => {
        const stepDistance =
          Math.max(...Vector3.toArray(BoundingBox.lengths(boundingBox))) *
          teleportDistanceScalar;

        const positionPlane = Plane.fromNormalAndCoplanarPoint(
          camera.up,
          camera.position
        );
        const projectedWorldPoint = Plane.projectPoint(
          positionPlane,
          worldPoint ?? camera.position
        );
        const distanceToWorldPoint = Vector3.distance(
          camera.position,
          projectedWorldPoint
        );

        if (
          distanceToWorldPoint < stepDistance &&
          distanceToWorldPoint > teleportCollisionDistance * 1.1
        ) {
          const mouseRayAtWorldPoint = Ray.create({
            ...mouseRay,
            origin: projectedWorldPoint,
          });
          const nextPosition = Plane.projectPoint(
            positionPlane,
            Ray.at(mouseRayAtWorldPoint, -teleportCollisionDistance)
          );

          return camera.update({
            position: nextPosition,
            lookAt: Vector3.add(
              camera.lookAt,
              Vector3.subtract(nextPosition, camera.position)
            ),
          });
        } else {
          const projectedNextStep = Plane.projectPoint(
            positionPlane,
            Ray.at(mouseRay, stepDistance)
          );

          return camera.update({
            position: projectedNextStep,
            lookAt: Vector3.add(
              camera.lookAt,
              Vector3.subtract(projectedNextStep, camera.position)
            ),
          });
        }
      });
    }
  }

  private async teleportToHit(point: Point.Point): Promise<void> {
    const worldPoint = await this.getWorldPointWithFallback(point);

    if (worldPoint != null) {
      return this.performInteraction(({ camera, boundingBox }) => {
        const shortestBoundingBoxLength = this.shortestLength(boundingBox);
        const heightScalar = this.model.getTeleportHeightPercentage() / 100;

        const cameraPlane = Plane.fromNormalAndCoplanarPoint(
          camera.up,
          camera.position
        );
        const projectedHitPosition = Plane.projectPoint(
          cameraPlane,
          worldPoint
        );

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
        const distanceToLookAt = Vector3.distance(
          camera.position,
          camera.lookAt
        );

        const newPosition = Ray.at(
          rayToHitPosition,
          distanceToHitPosition - shortestBoundingBoxLength * heightScalar
        );
        const newPositionViewVectorRay = Ray.create({
          origin: newPosition,
          direction: Vector3.normalize(camera.viewVector),
        });

        return camera.update({
          position: newPosition,
          lookAt: Ray.at(newPositionViewVectorRay, distanceToLookAt),
        });
      });
    }
  }

  private async teleportAndAlign(point: Point.Point): Promise<void> {
    const hits = await this.api?.hitItems(point);
    const hit = hits != null ? hits[0] : undefined;

    if (hit?.hitNormal != null && hit?.hitPoint) {
      await this.performInteraction(({ camera, boundingBox }) => {
        const shortestBoundingBoxLength = this.shortestLength(boundingBox);
        const heightScalar = this.model.getTeleportHeightPercentage() / 100;

        const upRay = Ray.create({
          origin: hit.hitPoint as Vector3.Vector3,
          direction: hit.hitNormal as Vector3.Vector3,
        });

        return camera.alignTo(
          Ray.at(upRay, shortestBoundingBoxLength * heightScalar),
          hit.hitNormal as Vector3.Vector3
        );
      });
    }
  }

  private async performInteraction(fn: CameraTransform<Camera>): Promise<void> {
    await this.beginInteraction();
    await this.api?.transformCamera(fn, this.renderConfiguration());
    await this.endInteraction();
  }

  private async getWorldPointWithFallback(
    point: Point.Point
  ): Promise<Vector3.Vector3 | undefined> {
    const worldPoint = await this.api?.getWorldPointFromViewport(point);

    if (worldPoint == null) {
      const hits = await this.api?.hitItems(point);
      const hit = hits != null ? hits[0] : undefined;

      return hit?.hitPoint != null
        ? (hit.hitPoint as Vector3.Vector3)
        : worldPoint;
    }
    return worldPoint;
  }

  private handleEnabledChange(enabled: boolean): void {
    if (enabled) {
      this.enable();
    } else {
      this.disable();
    }
  }

  private handleTeleportModeChange(mode?: ViewerTeleportMode): void {
    this.cursorDisposable?.dispose();

    if (mode != null) {
      this.cursorDisposable = this.api?.addCursor('crosshair');
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
