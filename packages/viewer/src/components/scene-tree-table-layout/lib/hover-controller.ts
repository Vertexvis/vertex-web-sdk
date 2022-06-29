import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

export class SceneTreeCellHoverController {
  public onStateChange = new EventDispatcher<string | undefined>();

  public setHovered(id?: string): void {
    this.onStateChange.emit(id);
  }

  public stateChanged(listener: Listener<string | undefined>): Disposable {
    return this.onStateChange.on(listener);
  }
}
