import { Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { ConfigProvider } from '../config';
import { InteractionApi } from './interactionApi';
import {
  PanInteraction,
  PivotInteraction,
  RotateInteraction,
  RotatePointInteraction,
  TwistInteraction,
  ZoomInteraction,
} from './mouseInteractions';
import { MultiElementInteractionHandler } from './multiElementInteractionHandler';

export class PointerInteractionHandler extends MultiElementInteractionHandler {
  private touchPoints: Set<number>;

  public constructor(
    getConfig: ConfigProvider,
    rotateInteraction = new RotateInteraction(),
    rotatePointInteraction = new RotatePointInteraction(),
    zoomInteraction = new ZoomInteraction(),
    panInteraction = new PanInteraction(),
    twistInteraction = new TwistInteraction(),
    pivotInteraction = new PivotInteraction()
  ) {
    super(
      'pointerdown',
      'pointerup',
      'pointermove',
      rotateInteraction,
      rotatePointInteraction,
      zoomInteraction,
      panInteraction,
      twistInteraction,
      pivotInteraction,
      getConfig
    );
    this.touchPoints = new Set();
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    super.initialize(element, api);

    element.addEventListener('pointerdown', this.handlePointerDown);
  }

  public addEventListenersToElement(element: HTMLElement): Disposable {
    element.addEventListener(this.downEvent, this.handleDownEvent);
    element.addEventListener('wheel', this.handleMouseWheel, {
      passive: false,
    });

    return {
      dispose: () => {
        element.removeEventListener(this.downEvent, this.handleDownEvent);
        element.removeEventListener('wheel', this.handleMouseWheel);
      },
    };
  }

  private handlePointerDown(event: PointerEvent): void {
    this.downPosition = Point.create(event.screenX, event.screenY);
    this.touchPoints.add(event.pointerId);

    if (this.touchPoints.size === 1) {
      window.addEventListener('pointerup', this.handlePointerUp);
    }

    if (this.touchPoints.size === 2) {
      this.disableIndividualInteractions = true;
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    this.touchPoints.delete(event.pointerId);

    if (this.touchPoints.size < 2) {
      this.disableIndividualInteractions = false;
    }

    if (this.touchPoints.size === 0) {
      window.removeEventListener('pointerup', this.handlePointerUp);
    }
  }
}
