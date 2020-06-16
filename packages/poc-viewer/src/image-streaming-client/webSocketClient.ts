import { Disposable } from '../utils/disposable';
import { EventDispatcher } from '../utils';
import { UrlProvider } from './url';

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

  public constructor(private reconnectDelays: number[] = WS_RECONNECT_DELAYS) {}

  public close(): void {
    if (this.webSocket != null) {
      this.webSocket.close();
    }
  }

  public async connect(urlProvider: UrlProvider): Promise<void> {
    this.webSocket = new WebSocket(urlProvider());
    this.webSocket.binaryType = 'arraybuffer';

    return new Promise((resolve, reject) => {
      const onOpen = (): void => {
        this.reopenAttempt = 0;
        resolve();
      };
      const onError = (): void => {
        reject();
        removeWebSocketListeners();
      };
      const onClose = (): void => {
        this.handleClose(urlProvider);
        removeWebSocketListeners();
      };
      const removeWebSocketListeners = (): void => {
        if (this.webSocket != null) {
          this.webSocket.removeEventListener('message', this.handleMessage);
          this.webSocket.removeEventListener('open', onOpen);
          this.webSocket.removeEventListener('error', onError);
          this.webSocket.removeEventListener('close', onClose);
        }
      };

      if (this.webSocket != null) {
        this.webSocket.addEventListener('message', this.handleMessage);
        this.webSocket.addEventListener('open', onOpen);
        this.webSocket.addEventListener('error', () => reject());
        this.webSocket.addEventListener('close', onClose);
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
  public async reconnect(urlProvider: UrlProvider): Promise<void> {
    await new Promise(resolve =>
      setTimeout(
        resolve,
        this.reconnectDelays[
          Math.min(this.reopenAttempt, this.reconnectDelays.length - 1)
        ]
      )
    );

    this.reopenAttempt += 1;

    try {
      await this.connect(urlProvider);
    } catch (e) {
      // Failed connection attempt here will be handled, and this exception can be ignored
    }
  }

  private handleMessage = (event: MessageEvent): void => {
    this.onMessageDispatcher.emit(event);
  };

  private handleClose = (urlProvider: UrlProvider): void => {
    this.reconnect(urlProvider);
  };
}
