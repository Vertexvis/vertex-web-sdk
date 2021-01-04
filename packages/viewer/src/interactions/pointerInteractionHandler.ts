import { BaseInteractionHandler } from './baseInteractionHandler';
import {
  ZoomInteraction,
  PanInteraction,
  RotateInteraction,
} from './mouseInteractions';

export class PointerInteractionHandler extends BaseInteractionHandler {
  public constructor() {
    super(
      'pointerdown',
      'pointerup',
      'pointermove',
      new RotateInteraction(),
      new ZoomInteraction(),
      new PanInteraction()
    );
  }
}
