import { Listener, Disposable, Async } from '@vertexvis/utils';
import { StreamApi } from '@vertexvis/stream-api';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

export const DEFAULT_TIMEOUT_IN_MS = 1000 * 10;

export class StreamApiEventDispatcher<T> {
  private listeners: Array<Listener<T>> = [];
  private eventDisposable?: Disposable;
  private requestDisposable?: Disposable;

  public constructor(
    private stream: StreamApi,
    private predicate: (
      msg: vertexvis.protobuf.stream.IStreamMessage
    ) => boolean,
    private transform: (msg: vertexvis.protobuf.stream.IStreamMessage) => T,
    private timeout: number = DEFAULT_TIMEOUT_IN_MS
  ) {
    this.handleMessage = this.handleMessage.bind(this);
  }

  public on(listener: Listener<T>): void {
    this.listeners = [...this.listeners, listener];
    if (this.eventDisposable == null || this.requestDisposable == null) {
      this.addListeners();
    }
  }

  public off(listener: Listener<T>): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
    if (this.listeners.length === 0) {
      this.removeListeners();
    }
  }

  public once(listener?: Listener<T>): Promise<T> {
    let handler: (data: T) => void;
    return Async.timeout(
      this.timeout,
      new Promise<T>((resolve) => {
        handler = (data: T) => {
          listener?.(data);
          resolve(data);
          this.off(handler);
        };

        this.on(handler);
      })
    ).finally(() => {
      this.off(handler);
    });
  }

  private handleMessage(msg: vertexvis.protobuf.stream.IStreamMessage): void {
    if (this.predicate(msg)) {
      this.listeners.forEach((l) => l(this.transform(msg)));
    }
  }

  private addListeners(): void {
    this.eventDisposable = this.stream.onEvent(this.handleMessage);
    this.requestDisposable = this.stream.onRequest(this.handleMessage);
  }

  private removeListeners(): void {
    this.eventDisposable?.dispose();
    this.requestDisposable?.dispose();
  }
}
