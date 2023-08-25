import { BoundingSphere, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { InteractionApi, InteractionHandler } from '../interactions';
import { Frame } from '../types';
import { WalkModeController } from './controller';

export class WalkInteractionHandler implements InteractionHandler {
  private api?: InteractionApi;

  private interval?: NodeJS.Timer;
  private pressed: Record<string, boolean> = {};
  private handlers: Record<string, VoidFunction> = {};

  private enabledChangeDisposable?: Disposable;

  public constructor(
    private controller: WalkModeController,
    private walkSpeed = 5,
    private pivotDegrees = 1,
    private repeatInterval = 25
  ) {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleEnabledChange = this.handleEnabledChange.bind(this);
    this.updateCamera = this.updateCamera.bind(this);

    this.handlers = {
      w: this.walkForward.bind(this),
      a: this.walkLeft.bind(this),
      s: this.walkBackward.bind(this),
      d: this.walkRight.bind(this),
      arrowup: this.pivotUp.bind(this),
      arrowdown: this.pivotDown.bind(this),
      arrowleft: this.pivotLeft.bind(this),
      arrowright: this.pivotRight.bind(this),
      pageup: this.moveUp.bind(this),
      pagedown: this.moveDown.bind(this),
    };

    this.enabledChangeDisposable = this.controller.onEnabledChange(
      this.handleEnabledChange
    );
  }

  public dispose(): void {
    this.disable();
    this.enabledChangeDisposable?.dispose();

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  public initialize(_: HTMLElement, api: InteractionApi): void {
    this.api = api;

    this.handleEnabledChange(this.controller.getEnabled());
  }

  public enable(): void {
    this.disable();

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public disable(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();

    if (!event.repeat && this.handlers[key] != null) {
      this.pressed = { ...this.pressed, [key]: true };

      if (
        Object.keys(this.pressed).length > 0 &&
        Object.keys(this.handlers).some((key) => this.pressed[key])
      ) {
        this.beginInteraction();
      }
    }
  }

  private handleKeyUp = async (event: KeyboardEvent): Promise<void> => {
    const key = event.key.toLocaleLowerCase();

    this.pressed = Object.keys(this.pressed)
      .filter((k) => k !== key)
      .reduce((pressed, k) => ({ ...pressed, [k]: true }), {});

    if (Object.keys(this.pressed).length === 0 && this.interval != null) {
      this.endInteraction();
    }
  };

  private handleEnabledChange(enabled: boolean): void {
    if (enabled) {
      this.enable();
    } else {
      this.disable();
    }
  }

  private beginInteraction(): void {
    if (!this.api?.isInteracting()) {
      this.api?.beginInteraction();
    }

    if (this.interval == null) {
      this.interval = setInterval(this.updateCamera, this.repeatInterval);
    }
  }

  private endInteraction = async (): Promise<void> => {
    if (this.interval != null) {
      clearInterval(this.interval);
      this.interval = undefined;
      await this.api?.endInteraction();
    }
  };

  private updateCamera(): void {
    Object.keys(this.handlers).forEach((key) => {
      if (this.pressed[key]) {
        this.handlers[key]();
      }
    });
  }

  private pivotLeft(): void {
    this.api?.pivotCamera(0, this.pivotDegrees);
  }

  private pivotRight(): void {
    this.api?.pivotCamera(0, -this.pivotDegrees);
  }

  private pivotUp(): void {
    this.api?.pivotCamera(-this.pivotDegrees, 0);
  }

  private pivotDown(): void {
    this.api?.pivotCamera(this.pivotDegrees, 0);
  }

  private walkForward(): void {
    this.walk(Vector3.forward());
  }

  private walkBackward(): void {
    this.walk(Vector3.back());
  }

  private walkLeft(): void {
    this.walk(Vector3.left());
  }

  private walkRight(): void {
    this.walk(Vector3.right());
  }

  private moveUp(): void {
    this.walk(Vector3.down());
  }

  private moveDown(): void {
    this.walk(Vector3.up());
  }

  private walk(delta: Vector3.Vector3): void {
    this.api?.transformCamera(({ camera, frame }) => {
      const { position, up, lookAt } = camera;

      const normalizedUp = Vector3.normalize(up);
      const normalizedViewVector = Vector3.normalize(camera.viewVector);

      const localX = Vector3.cross(normalizedUp, normalizedViewVector);
      const localZ = Vector3.cross(localX, normalizedUp);

      const scaledDelta = Vector3.scale(this.relativeWalkSpeed(frame), delta);
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

  private relativeWalkSpeed(frame: Frame): number {
    const speedScalar = (5 / this.walkSpeed) * 100;
    const boundingBoxScalar = BoundingSphere.create(
      frame.scene.boundingBox
    ).radius;
    return boundingBoxScalar / speedScalar;
  }
}
