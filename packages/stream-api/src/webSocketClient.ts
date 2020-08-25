import { Disposable, EventDispatcher } from '@vertexvis/utils';
import { ConnectionDescriptor } from './connection';

const WS_RECONNECT_DELAYS = [0, 1000, 1000, 5000];

export type WebSocketSendData =
  | string
  | ArrayBufferLike
  | Blob
  | ArrayBufferView;

type MessageHandler = (event: MessageEvent) => void;

export class WebSocketClient {
  private webSocket?: WebSocket;
  private onMessageDispatcher = new EventDispatcher<MessageEvent>();
  private reopenAttempt = 0;
  private descriptor?: ConnectionDescriptor;
  private timer?: number;
  private listeners?: Disposable;

  public constructor(private reconnectDelays: number[] = WS_RECONNECT_DELAYS) {}

  public close(): void {
    if (this.webSocket != null) {
      this.removeWebSocketListeners();
      this.webSocket.close();
      if (this.timer != null) {
        window.clearTimeout(this.timer);
        this.webSocket = undefined;
      }
    }
  }

  public async connect(descriptor: ConnectionDescriptor): Promise<void> {
    this.webSocket = new WebSocket(descriptor.url, descriptor.protocols);
    this.webSocket.binaryType = 'arraybuffer';
    this.descriptor = descriptor;

    return new Promise((resolve, reject) => {
      if (this.webSocket != null) {
        this.listeners = this.addWebSocketListeners(
          this.webSocket,
          resolve,
          reject
        );
      }
    });
  }

  public onMessage(handler: MessageHandler): Disposable {
    return this.onMessageDispatcher.on(handler);
  }

  public send(data: WebSocketSendData): void {
    if (this.webSocket != null) {
      this.webSocket.send(data);
    }
  }

  /**
   * @private Used for internals or testing.
   */
  public async reconnect(descriptor: ConnectionDescriptor): Promise<void> {
    await new Promise(resolve => {
      this.timer = window.setTimeout(
        resolve,
        this.reconnectDelays[
          Math.min(this.reopenAttempt, this.reconnectDelays.length - 1)
        ]
      );
    });

    this.reopenAttempt += 1;

    try {
      await this.connect(descriptor);
    } catch (e) {
      // Failed connection attempt here will be handled, and this exception can be ignored
    }
  }

  private addWebSocketListeners = (
    ws: WebSocket,
    resolve: VoidFunction,
    reject: VoidFunction
  ): Disposable => {
    const onOpen = (): void => this.onOpen(resolve);
    const onError = (): void => reject();
    ws.addEventListener('message', this.handleMessage);
    ws.addEventListener('open', onOpen);
    ws.addEventListener('error', onError);
    ws.addEventListener('close', this.handleClose);

    return {
      dispose: () => {
        ws.removeEventListener('message', this.handleMessage);
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        ws.removeEventListener('close', this.handleClose);
      },
    };
  };

  private removeWebSocketListeners(): void {
    this.listeners?.dispose();
  }

  private handleMessage = (event: MessageEvent): void => {
    this.onMessageDispatcher.emit(event);
  };

  private handleClose = (): void => {
    this.removeWebSocketListeners();
    if (this.descriptor != null) {
      this.reconnect(this.descriptor);
    }
  };

  private onOpen(resolve: VoidFunction): void {
    this.reopenAttempt = 0;
    resolve();
  }
}
