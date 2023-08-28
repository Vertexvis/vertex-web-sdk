import { Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { InteractionApiPerspective, InteractionHandler } from '../interactions';
import { targetIsElement } from './dom';
import { ViewerWalkModeOperation, WalkModeModel } from './model';

export class WalkInteractionHandler implements InteractionHandler {
  private api?: InteractionApiPerspective;

  private interval?: NodeJS.Timer;
  private pressed: Record<string, boolean> = {};
  private handlers: Record<ViewerWalkModeOperation, VoidFunction>;

  private enabledChangeDisposable?: Disposable;
  private keyBindingsChangeDisposable?: Disposable;
  private configurationChangeDisposable?: Disposable;

  public constructor(private model: WalkModeModel) {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleEnabledChange = this.handleEnabledChange.bind(this);
    this.restartInteraction = this.restartInteraction.bind(this);
    this.updateCamera = this.updateCamera.bind(this);

    this.handlers = {
      [ViewerWalkModeOperation.MOVE_DOWN]: this.moveDown.bind(this),
      [ViewerWalkModeOperation.MOVE_UP]: this.moveUp.bind(this),
      [ViewerWalkModeOperation.PIVOT_DOWN]: this.pivotDown.bind(this),
      [ViewerWalkModeOperation.PIVOT_LEFT]: this.pivotLeft.bind(this),
      [ViewerWalkModeOperation.PIVOT_RIGHT]: this.pivotRight.bind(this),
      [ViewerWalkModeOperation.PIVOT_UP]: this.pivotUp.bind(this),
      [ViewerWalkModeOperation.WALK_BACKWARD]: this.walkBackward.bind(this),
      [ViewerWalkModeOperation.WALK_FORWARD]: this.walkForward.bind(this),
      [ViewerWalkModeOperation.WALK_LEFT]: this.walkLeft.bind(this),
      [ViewerWalkModeOperation.WALK_RIGHT]: this.walkRight.bind(this),
    };

    this.enabledChangeDisposable = this.model.onEnabledChange(
      this.handleEnabledChange
    );
    this.keyBindingsChangeDisposable = this.model.onKeyBindingsChange(
      this.restartInteraction
    );
    this.configurationChangeDisposable = this.model.onConfigurationChange(
      this.restartInteraction
    );
  }

  public dispose(): void {
    this.disable();
    this.enabledChangeDisposable?.dispose();
    this.keyBindingsChangeDisposable?.dispose();
    this.configurationChangeDisposable?.dispose();

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  public initialize(_: HTMLElement, api: InteractionApiPerspective): void {
    this.api = api;

    this.handleEnabledChange(this.model.getEnabled());
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

    const exclude =
      targetIsElement(event.target) &&
      this.model.isElementExcluded(event.target);

    if (!event.repeat && !exclude) {
      this.pressed = { ...this.pressed, [key]: true };

      this.tryBeginInteraction();
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

  private restartInteraction(): void {
    this.clearInterval();
    this.tryBeginInteraction();
  }

  private tryBeginInteraction(): void {
    if (Object.keys(this.pressed).length > 0 && this.someOperationMatches()) {
      this.beginInteraction();
    }
  }

  private beginInteraction(): void {
    if (!this.api?.isInteracting()) {
      this.api?.beginInteraction();
    }

    if (this.interval == null) {
      this.interval = setInterval(
        this.updateCamera,
        this.model.getKeyboardRepeatInterval()
      );
    }
  }

  private endInteraction = async (): Promise<void> => {
    this.clearInterval();
    await this.api?.endInteraction();
  };

  private clearInterval(): void {
    if (this.interval != null) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private updateCamera(): void {
    Object.keys(this.handlers).forEach((key) => {
      const op = key as ViewerWalkModeOperation;

      if (this.model.operationMatches(op, this.pressed)) {
        this.handlers[op]();
      }
    });
  }

  private someOperationMatches(): boolean {
    return Object.keys(this.handlers).some((op) =>
      this.model.operationMatches(op as ViewerWalkModeOperation, this.pressed)
    );
  }

  private pivotLeft(): void {
    this.api?.pivotCamera(0, this.model.getKeyboardPivotDegrees());
  }

  private pivotRight(): void {
    this.api?.pivotCamera(0, -this.model.getKeyboardPivotDegrees());
  }

  private pivotUp(): void {
    this.api?.pivotCamera(-this.model.getKeyboardPivotDegrees(), 0);
  }

  private pivotDown(): void {
    this.api?.pivotCamera(this.model.getKeyboardPivotDegrees(), 0);
  }

  private walkForward(): void {
    this.api?.walk(Vector3.scale(this.relativeWalkSpeed(), Vector3.forward()));
  }

  private walkBackward(): void {
    this.api?.walk(Vector3.scale(this.relativeWalkSpeed(), Vector3.back()));
  }

  private walkLeft(): void {
    this.api?.walk(Vector3.scale(this.relativeWalkSpeed(), Vector3.left()));
  }

  private walkRight(): void {
    this.api?.walk(Vector3.scale(this.relativeWalkSpeed(), Vector3.right()));
  }

  private moveUp(): void {
    this.api?.walk(Vector3.scale(this.relativeWalkSpeed(), Vector3.down()));
  }

  private moveDown(): void {
    this.api?.walk(Vector3.scale(this.relativeWalkSpeed(), Vector3.up()));
  }

  private relativeWalkSpeed(): number {
    const speedScalar = (5 / this.model.getKeyboardWalkSpeed()) * 100;
    return 1 / speedScalar;
  }
}
