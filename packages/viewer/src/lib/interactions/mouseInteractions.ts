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
    element: HTMLElement
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
    api: InteractionApi
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
    api: InteractionApi
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

  private didTransformBegin = false;
  private interactionTimer: number | undefined;
  private startPt?: Point.Point;

  public constructor(
    private interactionConfigProvider: InteractionConfigProvider
  ) {
    super();
  }

  public beginDrag(
    event: MouseEvent,
    canvasPosition: Point.Point,
    api: InteractionApi,
    element: HTMLElement
  ): void {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.clientX, event.clientY);
      const rect = element.getBoundingClientRect();
      const point = getMouseClientPosition(event, rect);
      this.startPt = point;
      api.beginInteraction();
    }
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null) {
      const position = Point.create(event.clientX, event.clientY);
      const delta = Point.subtract(position, this.currentPosition);

      if (this.startPt != null) {
        api.zoomCameraToPoint(this.startPt, delta.y);
        this.currentPosition = position;
      }
    }
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
    this.stopInteractionTimer();
    this.didTransformBegin = false;
    this.startPt = undefined;
  }

  public async zoom(delta: number, api: InteractionApi): Promise<void> {
    await this.operateWithTimer(api, () =>
      api.zoomCamera(this.getDirectionalDelta(delta))
    );
  }

  public async zoomToPoint(
    pt: Point.Point,
    delta: number,
    api: InteractionApi
  ): Promise<void> {
    await this.operateWithTimer(api, () =>
      api.zoomCameraToPoint(pt, this.getDirectionalDelta(delta))
    );
  }

  private async beginInteraction(api: InteractionApi): Promise<void> {
    this.didTransformBegin = true;
    await api.beginInteraction();
  }

  private async endInteraction(api: InteractionApi): Promise<void> {
    this.didTransformBegin = false;
    await api.endInteraction();
  }

  private resetInteractionTimer(api: InteractionApi): void {
    this.stopInteractionTimer();
    this.startInteractionTimer(api);
  }

  private getDirectionalDelta(delta: number): number {
    return this.interactionConfigProvider().reverseMouseWheelDirection
      ? -delta
      : delta;
  }

  private getInteractionDelay(): number {
    return this.interactionConfigProvider().mouseWheelInteractionEndDebounce;
  }

  private startInteractionTimer(api: InteractionApi): void {
    this.interactionTimer = window.setTimeout(async () => {
      this.interactionTimer = undefined;
      await this.endInteraction(api);
    }, this.getInteractionDelay());
  }

  private stopInteractionTimer(): void {
    if (this.interactionTimer != null) {
      window.clearTimeout(this.interactionTimer);
      this.interactionTimer = undefined;
    }
  }

  private async operateWithTimer(
    api: InteractionApi,
    f: () => void | Promise<void>
  ): Promise<void> {
    if (!this.didTransformBegin) {
      await this.beginInteraction(api);
    }

    this.resetInteractionTimer(api);
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
    element: HTMLElement
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
    element: HTMLElement
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
    api: InteractionApi
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
