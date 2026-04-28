import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { DocumentApi, DocumentApiState } from './api';

/**
 * A renderer that is responsible for listening to state changes in a `DocumentApi`
 * and rendering resulting images to the provided canvas element.
 */
export abstract class DocumentRenderer implements Disposable {
  protected readonly pageLoaded = new EventDispatcher<DocumentApiState>();
  protected readonly pageDrawn = new EventDispatcher<DocumentApiState>();

  public constructor(protected readonly api: DocumentApi, protected readonly canvas: HTMLCanvasElement) {}

  public onPageLoaded(listener: Listener<DocumentApiState>): Disposable {
    return this.pageLoaded.on(listener);
  }

  public onPageDrawn(listener: Listener<DocumentApiState>): Disposable {
    return this.pageDrawn.on(listener);
  }

  public abstract dispose(): void | Promise<void>;
}
