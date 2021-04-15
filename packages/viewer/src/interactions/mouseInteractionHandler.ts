import { ConfigProvider } from '../config/config';
import { CanvasDepthProvider } from '../rendering';
import { BaseInteractionHandler } from './baseInteractionHandler';
import {
  RotateInteraction,
  ZoomInteraction,
  PanInteraction,
  TwistInteraction,
  RotateDepthInteraction,
} from './mouseInteractions';

export class MouseInteractionHandler extends BaseInteractionHandler {
  public constructor(
    getConfig: ConfigProvider,
    depthProvider: CanvasDepthProvider,
    rotateInteraction = new RotateInteraction(),
    rotateDepthInteraction = new RotateDepthInteraction(),
    zoomInteraction = new ZoomInteraction(),
    panInteraction = new PanInteraction(),
    twistInteraction = new TwistInteraction()
  ) {
    super(
      'mousedown',
      'mouseup',
      'mousemove',
      rotateInteraction,
      rotateDepthInteraction,
      zoomInteraction,
      panInteraction,
      twistInteraction,
      getConfig,
      depthProvider
    );
  }
}
