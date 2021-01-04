import { BaseInteractionHandler } from './baseInteractionHandler';
import {
  RotateInteraction,
  ZoomInteraction,
  PanInteraction,
} from './mouseInteractions';

export class MouseInteractionHandler extends BaseInteractionHandler {
  public constructor(
    rotateInteraction = new RotateInteraction(),
    zoomInteraction = new ZoomInteraction(),
    panInteraction = new PanInteraction()
  ) {
    super(
      'mousedown',
      'mouseup',
      'mousemove',
      rotateInteraction,
      zoomInteraction,
      panInteraction
    );
  }
}
