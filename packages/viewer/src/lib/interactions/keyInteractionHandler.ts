import { InteractionHandler } from './interactionHandler';
import { InteractionApi } from './interactionApi';
import { Scene } from '../scenes';

type SceneProvider = () => Scene;

export class KeyInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private interactionApi?: InteractionApi;

  public constructor(private getScene: SceneProvider) {}

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;

    window.addEventListener('keydown', this.fitAllWithFKey);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.fitAllWithFKey);
    this.element = undefined;
  }

  private fitAllWithFKey = async (event: KeyboardEvent): Promise<void> => {
    if (event.key === 'f') {
      const scene = this.getScene();
      await scene.camera().viewAll().render();
    }
  };
}
