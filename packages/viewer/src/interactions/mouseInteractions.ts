import { InteractionApi } from './interactionApi';
import { Point } from '@vertexvis/geometry';

export class MouseInteraction {
  public beginDrag(event: MouseEvent, api: InteractionApi): void {
    // noop
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    // noop
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    // noop
  }

  public zoom(delta: number, api: InteractionApi): void {
    // noop
  }
}

export class RotateInteraction extends MouseInteraction {
  private currentPosition: Point.Point | undefined;

  private lastAngle: number | undefined;

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
    if (this.currentPosition != null) {
      api.endInteraction();
      this.currentPosition = undefined;
    }
  }
}

export class ZoomInteraction extends MouseInteraction {
  private didTransformBegin = false;
  private interactionTimer: number | undefined;

  private currentPosition: Point.Point | undefined;

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
    if (this.currentPosition != null) {
      api.endInteraction();
      this.currentPosition = undefined;
    }
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
  private currentPosition: Point.Point | undefined;

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
    if (this.currentPosition != null) {
      api.endInteraction();
      this.currentPosition = undefined;
    }
  }
}

export class TwistInteraction extends MouseInteraction {
  private currentPosition: Point.Point | undefined;

  public beginDrag(event: MouseEvent, api: InteractionApi): void {
    this.currentPosition = Point.create(event.screenX, event.screenY);
    api.beginInteraction();
  }

  public drag(event: MouseEvent, api: InteractionApi): void {
    const position = Point.create(event.screenX, event.screenY);
    api.twistCamera(position);
  }

  public endDrag(event: MouseEvent, api: InteractionApi): void {
    if (this.currentPosition != null) {
      api.endInteraction();
      this.currentPosition = undefined;
    }
  }
}
