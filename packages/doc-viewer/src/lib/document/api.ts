import { Dimensions } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class DocumentApi<T = any> {
  protected state?: T;
  protected readonly stateChanged = new EventDispatcher<T>();

  protected updateState(state: T): void {
    this.state = state;
    this.stateChanged.emit(state);
  }

  public onStateChanged(listener: Listener<T>): Disposable {
    return this.stateChanged.on(listener);
  }

  public abstract updateViewport(viewport: Dimensions.Dimensions): Promise<void>;

  public abstract load(uri: string): Promise<void>;
  public abstract loadPage(pageNumber: number): Promise<void>;
}
