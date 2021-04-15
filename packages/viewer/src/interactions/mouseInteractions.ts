import { InteractionApi } from './interactionApi';
import { Point } from '@vertexvis/geometry';
import { InteractionType } from './baseInteractionHandler';

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
    api: InteractionApi,
    depth?: number
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

  public zoom(delta: number, api: InteractionApi): void {
    // noop
  }
}

export class RotateInteraction extends MouseInteraction {
  public type: InteractionType = 'rotate';

  public beginDrag(event: MouseEvent, api: InteractionApi): void {
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

export class RotateDepthInteraction extends MouseInteraction {
  public type: InteractionType = 'rotate-depth';

  private startingPosition?: Point.Point;
  private depth?: number;

  public beginDrag(
    event: MouseEvent,
    api: InteractionApi,
    depth?: number
  ): void {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.screenX, event.screenY);
      this.startingPosition = Point.create(event.screenX, event.screenY);
      this.depth = depth;
      api.beginInteraction();
    }
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null && this.startingPosition != null) {
      const position = Point.create(event.screenX, event.screenY);
      const delta = Point.subtract(position, this.currentPosition);

      api.rotateCameraDepth(delta, this.startingPosition, this.depth);
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

  public constructor(private interactionTimeout = 1000) {
    super();
  }

  public beginDrag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.screenX, event.screenY);
      api.beginInteraction();
    }
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null) {
      const position = Point.create(event.screenX, event.screenY);
      const delta = Point.subtract(position, this.currentPosition);

      api.zoomCamera(delta.y);
      this.currentPosition = position;
    }
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
  }

  public zoom(delta: number, api: InteractionApi): void {
    if (!this.didTransformBegin) {
      this.beginInteraction(api);
    }

    this.resetInteractionTimer(api);
    api.zoomCamera(delta);
  }

  private beginInteraction(api: InteractionApi): void {
    this.didTransformBegin = true;
    api.beginInteraction();
  }

  private endInteraction(api: InteractionApi): void {
    this.didTransformBegin = false;
    api.endInteraction();
  }

  private resetInteractionTimer(api: InteractionApi): void {
    this.stopInteractionTimer();
    this.startInteractionTimer(api);
  }

  private startInteractionTimer(api: InteractionApi): void {
    this.interactionTimer = window.setTimeout(() => {
      this.interactionTimer = undefined;
      this.endInteraction(api);
    }, this.interactionTimeout);
  }

  private stopInteractionTimer(): void {
    if (this.interactionTimer != null) {
      window.clearTimeout(this.interactionTimer);
      this.interactionTimer = undefined;
    }
  }
}

export class PanInteraction extends MouseInteraction {
  public type: InteractionType = 'pan';

  public beginDrag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition == null) {
      this.currentPosition = Point.create(event.screenX, event.screenY);
      api.beginInteraction();
    }
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null) {
      const position = Point.create(event.screenX, event.screenY);
      const delta = Point.subtract(position, this.currentPosition);

      api.panCamera(delta);
      this.currentPosition = position;
    }
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
  }
}

export class TwistInteraction extends MouseInteraction {
  public type: InteractionType = 'twist';

  public beginDrag(event: MouseEvent, api: InteractionApi): void {
    this.currentPosition = Point.create(event.screenX, event.screenY);
    api.beginInteraction();
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    const position = Point.create(event.screenX, event.screenY);
    this.currentPosition = position;

    api.twistCamera(position);
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    super.endDrag(event, api);
  }
}
