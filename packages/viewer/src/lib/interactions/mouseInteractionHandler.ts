import { ConfigProvider } from '../config';
import { BaseInteractionHandler } from './baseInteractionHandler';
import {
  PanInteraction,
  RotateInteraction,
  RotatePointInteraction,
  TwistInteraction,
  ZoomInteraction,
} from './mouseInteractions';

export class MouseInteractionHandler extends BaseInteractionHandler {
  public constructor(
    getConfig: ConfigProvider,
    rotateInteraction = new RotateInteraction(),
    rotatePointInteraction = new RotatePointInteraction(),
    zoomInteraction = new ZoomInteraction(),
    panInteraction = new PanInteraction(),
    twistInteraction = new TwistInteraction()
  ) {
    super(
      'mousedown',
      'mouseup',
      'mousemove',
      rotateInteraction,
      rotatePointInteraction,
      zoomInteraction,
      panInteraction,
      twistInteraction,
      getConfig
    );
  }
}
