import { Point } from '@vertexvis/geometry';

import { ConfigProvider } from '../config';
import { BaseInteractionHandler } from './baseInteractionHandler';
import { InteractionApi } from './interactionApi';
import {
  PanInteraction,
  PivotInteraction,
  RotateInteraction,
  RotatePointInteraction,
  TwistInteraction,
  ZoomInteraction,
} from './mouseInteractions';

export class PointerInteractionHandler extends BaseInteractionHandler {
  private touchPoints: Set<number>;

  public constructor(getConfig: ConfigProvider) {
    super(
      'pointerdown',
      'pointerup',
      'pointermove',
      new RotateInteraction(),
      new RotatePointInteraction(),
      new ZoomInteraction(),
      new PanInteraction(),
      new TwistInteraction(),
      new PivotInteraction(),
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
