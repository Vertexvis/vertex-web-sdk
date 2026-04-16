import { Disposable } from '@vertexvis/utils';

import { DocumentApi } from './api';

/**
 * A renderer that is responsible for listening to state changes in a `DocumentApi`
 * and rendering resulting images to the provided canvas element.
 */
export abstract class DocumentRenderer implements Disposable {
  public constructor(protected readonly api: DocumentApi, protected readonly canvas: HTMLCanvasElement) {}

  public abstract dispose(): void | Promise<void>;
}
