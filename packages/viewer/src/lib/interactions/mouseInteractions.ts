import { Point } from '@vertexvis/geometry';

import { getMouseClientPosition } from '../dom';
import { InteractionType } from './baseInteractionHandler';
import { InteractionApi, InteractionConfigProvider } from './interactionApi';

export abstract class MouseInteraction {
  protected currentPosition: Point.Point | undefined;

  protected abstract type: InteractionType;

  public setPosition(position?: Point.Point): void {
    this.currentPosition = position;
  }

  public getPosition(): Point.Point | undefined {
    return this.currentPosition;
  }

  public getType(): InteractionType {
    return this.type;
  }

  public beginDrag(
    event: MouseEvent,
    canvasPosition: Point.Point,
    api: InteractionApi,
    element: HTMLElement,
  ): void {
    // noop
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    // noop
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null) {
      api.endInteraction();
      this.currentPosition = undefined;
    }
  }

  public async zoom(delta: number, api: InteractionApi): Promise<void> {
    // noop
  }
}

export class RotateInteraction extends MouseInteraction {
  public type: InteractionType = 'rotate';

  public beginDrag(
    event: MouseEvent,
    canvasPosition: Point.Point,
    api: InteractionApi,
  ): void {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.screenX, event.screenY);
      api.beginInteraction();
    }
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null) {
      const position = Point.create(event.screenX, event.screenY);
      const delta = Point.subtract(position, this.currentPosition);

      api.rotateCamera(delta);
      this.currentPosition = position;
    }
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
  }
}

export class RotatePointInteraction extends MouseInteraction {
  public type: InteractionType = 'rotate-point';

  private startingPosition?: Point.Point;

  public beginDrag(
    event: MouseEvent,
    canvasPosition: Point.Point,
    api: InteractionApi,
  ): void {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.screenX, event.screenY);
      this.startingPosition = canvasPosition;
      api.beginInteraction();
    }
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null && this.startingPosition != null) {
      const position = Point.create(event.screenX, event.screenY);
      const delta = Point.subtract(position, this.currentPosition);

      api.rotateCameraAtPoint(delta, this.startingPosition);
      this.currentPosition = position;
    }
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
  }
}

export class ZoomInteraction extends MouseInteraction {
  public type: InteractionType = 'zoom';

  private isTransforming = false;
  private interactionTimer: number | undefined;
  private startPt?: Point.Point;

  public constructor(
    private interactionConfigProvider: InteractionConfigProvider,
  ) {
    super();
  }

  public async beginDrag(
    event: MouseEvent,
    canvasPosition: Point.Point,
    api: InteractionApi,
    element: HTMLElement,
  ): Promise<void> {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.clientX, event.clientY);
      const rect = element.getBoundingClientRect();
      const point = getMouseClientPosition(event, rect);
      this.startPt = point;
      await api.beginInteraction();
    }
  }

  public async drag(event: MouseEvent, api: InteractionApi): Promise<void> {
    if (this.currentPosition != null) {
      const position = Point.create(event.clientX, event.clientY);
      const delta = Point.subtract(position, this.currentPosition);

      if (this.startPt != null) {
        await api.zoomCameraToPoint(this.startPt, delta.y);
        this.currentPosition = position;
      }
    }
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
    this.stopInteractionTimer();
    this.isTransforming = false;
    this.startPt = undefined;
  }

  public async zoom(
    delta: number,
    api: InteractionApi,
    extraDelayMs?: number,
  ): Promise<void> {
    await this.runWheelZoomInteraction(
      api,
      () => api.zoomCamera(this.getDirectionalDelta(delta)),
      extraDelayMs,
    );
  }

  public async zoomToPoint(
    pt: Point.Point,
    delta: number,
    api: InteractionApi,
    extraDelayMs?: number,
  ): Promise<void> {
    await this.runWheelZoomInteraction(
      api,
      () => api.zoomCameraToPoint(pt, this.getDirectionalDelta(delta)),
      extraDelayMs,
    );
  }

  private async beginInteraction(api: InteractionApi): Promise<void> {
    this.isTransforming = true;
    await api.beginInteraction();
  }

  private async endInteraction(api: InteractionApi): Promise<void> {
    this.isTransforming = false;
    await api.endInteraction();
  }

  private resetInteractionTimer(
    api: InteractionApi,
    extraDelayMs?: number,
  ): void {
    this.stopInteractionTimer();
    this.startInteractionTimer(api, extraDelayMs);
  }

  private getDirectionalDelta(delta: number): number {
    return this.interactionConfigProvider().reverseMouseWheelDirection
      ? -delta
      : delta;
  }

  /**
   * If this value gets too low, can cause animation jitter in certain scenarios
   */
  private getInteractionDelay(): number {
    return this.interactionConfigProvider().mouseWheelInteractionEndDebounce;
  }

  /**
   * Uses a configured interaction delay, but certain interactions like wheel zoom benefit from extra delay
   */
  private startInteractionTimer(api: InteractionApi, extraDelayMs = 0): void {
    this.interactionTimer = window.setTimeout(async () => {
      this.interactionTimer = undefined;
      await this.endInteraction(api);
    }, extraDelayMs + this.getInteractionDelay());
  }

  private stopInteractionTimer(): void {
    if (this.interactionTimer != null) {
      window.clearTimeout(this.interactionTimer);
      this.interactionTimer = undefined;
    }
  }

  private async runWheelZoomInteraction(
    api: InteractionApi,
    f: () => void | Promise<void>,
    extraDelayMs?: number,
  ): Promise<void> {
    if (!this.isTransforming) {
      await this.beginInteraction(api);
    }

    this.resetInteractionTimer(api, extraDelayMs);
    f();
  }
}

export class PanInteraction extends MouseInteraction {
  public type: InteractionType = 'pan';

  private canvasRect?: DOMRect;

  public beginDrag(
    event: MouseEvent,
    canvasPosition: Point.Point,
    api: InteractionApi,
    element: HTMLElement,
  ): void {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.screenX, event.screenY);
      this.canvasRect = element.getBoundingClientRect();
      api.beginInteraction();
    }
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null && this.canvasRect != null) {
      const position = getMouseClientPosition(event, this.canvasRect);
      api.panCameraToScreenPoint(position);
      this.currentPosition = position;
    }
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
  }
}

export class TwistInteraction extends MouseInteraction {
  public type: InteractionType = 'twist';

  private canvasRect?: DOMRect;

  public beginDrag(
    event: MouseEvent,
    canvasPosition: Point.Point,
    api: InteractionApi,
    element: HTMLElement,
  ): void {
    this.currentPosition = Point.create(event.offsetX, event.offsetY);
    this.canvasRect = element.getBoundingClientRect();
    api.beginInteraction();
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    const position = getMouseClientPosition(event, this.canvasRect);
    this.currentPosition = position;

    api.twistCamera(position);
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
  }
}

export class PivotInteraction extends MouseInteraction {
  public type: InteractionType = 'pivot';

  public beginDrag(
    event: MouseEvent,
    canvasPosition: Point.Point,
    api: InteractionApi,
  ): void {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.screenX, event.screenY);
      api.beginInteraction();
    }
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null) {
      const position = Point.create(event.screenX, event.screenY);
      const delta = Point.subtract(position, this.currentPosition);

      api.pivotCamera(-0.25 * delta.y, 0.25 * delta.x);
      this.currentPosition = position;
    }
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
  }
}
