import { BaseInteractionHandler } from './baseInteractionHandler';
import { Point } from '@vertexvis/geometry';
import {
  ZoomInteraction,
  PanInteraction,
  RotateInteraction,
} from './mouseInteractions';
import { InteractionApi } from './interactionApi';

export class PointerInteractionHandler extends BaseInteractionHandler {
  private touchPoints: Record<string, Point.Point> = {};

  public constructor() {
    super(
      'pointerdown',
      'pointerup',
      'pointermove',
      new RotateInteraction(),
      new ZoomInteraction(),
      new PanInteraction()
    );

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    super.initialize(element, api);

    element.addEventListener('pointerdown', this.handlePointerDown);
  }

  private handlePointerDown(event: PointerEvent): void {
    event.preventDefault();
    this.downPosition = Point.create(event.screenX, event.screenY);
    this.touchPoints = {
      ...this.touchPoints,
      [event.pointerId]: this.downPosition,
    };

    const keys = Object.keys(this.touchPoints);
    if (keys.length === 2) {
      this.disableIndividualInteractions = true;
    }
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private handlePointerUp(event: PointerEvent): void {
    this.interactionApi?.endInteraction();
    this.touchPoints = {};
    this.disableIndividualInteractions = false;

    window.removeEventListener('pointerup', this.handlePointerUp);
  }
}
