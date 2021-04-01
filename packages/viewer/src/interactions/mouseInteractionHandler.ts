import { ConfigProvider } from '../config/config';
import { BaseInteractionHandler } from './baseInteractionHandler';
import {
  RotateInteraction,
  ZoomInteraction,
  PanInteraction,
  TwistInteraction,
} from './mouseInteractions';

export class MouseInteractionHandler extends BaseInteractionHandler {
  public constructor(
    getConfig: ConfigProvider,
    rotateInteraction = new RotateInteraction(),
    zoomInteraction = new ZoomInteraction(),
    panInteraction = new PanInteraction(),
    twistInteraction = new TwistInteraction()
  ) {
    super(
      'mousedown',
      'mouseup',
      'mousemove',
      rotateInteraction,
      zoomInteraction,
      panInteraction,
      twistInteraction,
      getConfig
    );
  }
}
