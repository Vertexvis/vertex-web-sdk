import { BaseInteractionHandler } from './baseInteractionHandler';
import { StreamApi, toProtoDuration } from '@vertexvis/stream-api';
import { Point } from '@vertexvis/geometry';
import {
  ZoomInteraction,
  PanInteraction,
  RotateInteraction,
  TwistInteraction,
  RotatePointInteraction,
} from './mouseInteractions';
import { InteractionApi } from './interactionApi';
import { ConfigProvider } from '../config';

export class KeyInteractionHandler extends BaseInteractionHandler {
  // private viewer: HTMLVertexViewerElement;
  // private stream?: StreamApi;

  public constructor(getConfig: ConfigProvider, private stream: StreamApi) {
    super(
      'pointerdown',
      'pointerup',
      'pointermove',
      new RotateInteraction(),
      new RotatePointInteraction(),
      new ZoomInteraction(),
      new PanInteraction(),
      new TwistInteraction(),
      getConfig
    );
    this.stream = stream;
    // this.viewer = viewer;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    super.initialize(element, api);

    window.addEventListener('keypress', this.fitAllWithFKey);
  }

  private async fitAllWithFKey(event: KeyboardEvent): Promise<void> {
    if (event.key === 'f') {
      console.log('The F key was pressed.');
      // console.log("this.stream: " + this.stream);
      // console.log("this.viewer.scene: " + this.viewer.scene());
      // const scene = await this.element.scene();
      // scene.camera().viewAll().render();
    }
  }
}
