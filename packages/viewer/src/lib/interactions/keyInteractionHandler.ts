import { InteractionHandler } from './interactionHandler';
import { InteractionApi } from './interactionApi';
import { Scene } from '../scenes';

type SceneProvider = () => Scene;

export class KeyInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private interactionApi?: InteractionApi;

  public constructor(private getScene: SceneProvider) {
    this.fitAllWithFKey = this.fitAllWithFKey.bind(this);
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;

    window.addEventListener('keypress', this.fitAllWithFKey);
  }

  public dispose(): void {
    this.element?.removeEventListener('keypress', this.fitAllWithFKey);
    this.element = undefined;
  }

  private async fitAllWithFKey(event: KeyboardEvent): Promise<void> {
    if (event.key === 'f') {
      const scene = this.getScene();
      scene.camera().viewAll().render();
    }
  }
}
