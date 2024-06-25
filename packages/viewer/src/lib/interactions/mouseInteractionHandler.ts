import { ConfigProvider } from '../config';
import { BaseInteractionHandler } from './baseInteractionHandler';
import {
  PanInteraction,
  PivotInteraction,
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
    zoomInteraction = new ZoomInteraction(() => getConfig().interactions),
    panInteraction = new PanInteraction(),
    twistInteraction = new TwistInteraction(),
    pivotInteraction = new PivotInteraction()
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
      pivotInteraction,
      getConfig
    );
  }
}
