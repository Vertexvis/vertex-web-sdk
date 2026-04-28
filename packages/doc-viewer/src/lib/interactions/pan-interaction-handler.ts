import { Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { DocumentApi } from '../document/api';

const DRAG_PIXEL_THRESHOLD = 2;

export class PanInteractionHandler implements Disposable {
  private lastPosition?: Point.Point;
  private isDragging = false;
  private downPosition?: Point.Point;

  public constructor(
    private element: HTMLElement,
    private api: DocumentApi,
  ) {
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

    this.element.addEventListener('pointerdown', this.handlePointerDown);
    this.element.addEventListener('wheel', this.handleWheel);
    window.addEventListener('wheel', this.handleWheel);
  }

  public dispose(): void {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('wheel', this.handleWheel);

    this.removeWindowListeners();
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const deltaX = -event.deltaX / 2;
    const deltaY = -event.deltaY / 2;

    if (deltaX !== 0 || deltaY !== 0) {
      this.api.panByDelta(Point.create(deltaX, deltaY));
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    this.downPosition = Point.create(event.clientX, event.clientY);
    this.lastPosition = this.downPosition;
    this.isDragging = false;

    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (this.lastPosition == null || this.downPosition == null) {
      return;
    }

    const currentPosition = Point.create(event.clientX, event.clientY);

    if (!this.isDragging && Point.distance(currentPosition, this.downPosition) < DRAG_PIXEL_THRESHOLD) {
      return;
    }

    this.isDragging = true;

    const delta = Point.subtract(currentPosition, this.lastPosition);
    this.lastPosition = currentPosition;

    this.api.panByDelta(delta);
  }

  private handlePointerUp(): void {
    this.lastPosition = undefined;
    this.downPosition = undefined;
    this.isDragging = false;

    this.removeWindowListeners();
  }

  private removeWindowListeners(): void {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('wheel', this.handleWheel);
  }
}
