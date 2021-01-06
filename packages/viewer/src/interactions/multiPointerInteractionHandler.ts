import { Point } from '@vertexvis/geometry';
import { InteractionApi } from './interactionApi';
import { MultiTouchInteractionHandler } from './multiTouchInteractionHandler';

export class MultiPointerInteractionHandler extends MultiTouchInteractionHandler {
  private touchPoints: Record<string, Point.Point> = {};

  public constructor() {
    super();
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  public dispose(): void {
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);
    super.dispose();
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    super.initialize(element, api);

    element.addEventListener('pointerdown', this.handlePointerDown);
  }

  private handlePointerDown(event: PointerEvent): void {
    event.preventDefault();
    const point = Point.create(event.screenX, event.screenY);
    this.touchPoints = {
      ...this.touchPoints,
      [event.pointerId]: point,
    };
    const keys = Object.keys(this.touchPoints);
    if (keys.length === 1) {
      window.addEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('pointerup', this.handlePointerUp);
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    event.preventDefault();

    if (this.touchPoints[event.pointerId] != null) {
      this.touchPoints[event.pointerId] = Point.create(
        event.screenX,
        event.screenY
      );
    }

    const keys = Object.keys(this.touchPoints);
    if (keys.length === 2) {
      const point1 = this.touchPoints[keys[0]];
      const point2 = this.touchPoints[keys[1]];
      this.handleTwoPointTouchMove(point1, point2);
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    delete this.touchPoints[event.pointerId];

    const keys = Object.keys(this.touchPoints);
    if (keys.length === 1) {
      this.interactionApi?.endInteraction();
      this.currentPosition1 = undefined;
      this.currentPosition2 = undefined;
    }
    if (keys.length === 0) {
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('pointerup', this.handlePointerUp);
    }
  }
}
