import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';

import { ConnectionDescriptor } from './connection';

export type WebSocketSendData =
  | string
  | ArrayBufferLike
  | Blob
  | ArrayBufferView;

export type MessageHandler = (event: MessageEvent) => void;

export type CloseHandler = (event: CloseEvent) => void;

export interface WebSocketClient {
  close(): void;
  connect(descriptor: ConnectionDescriptor): Promise<void>;
  onMessage(handler: MessageHandler): Disposable;
  onClose(handler: CloseHandler): Disposable;
  send(data: WebSocketSendData): void;
}

export class WebSocketClientImpl implements WebSocketClient {
  private webSocket?: WebSocket;
  private listeners: Record<UUID.UUID, Disposable> = {};

  private onMessageDispatcher = new EventDispatcher<MessageEvent>();
  private onCloseDispatcher = new EventDispatcher<CloseEvent>();

  public close(): void {
    if (this.webSocket != null) {
      this.webSocket.close();
    }
  }

  public async connect(descriptor: ConnectionDescriptor): Promise<void> {
    const id = UUID.create();
    this.webSocket = new WebSocket(descriptor.url, descriptor.protocols);
    this.webSocket.binaryType = 'arraybuffer';

    return new Promise((resolve, reject) => {
      if (this.webSocket != null) {
        this.listeners[id] = this.addWebSocketListeners(
          this.webSocket,
          id,
          resolve,
          reject
        );
      }
    });
  }

  public onMessage(handler: MessageHandler): Disposable {
    return this.onMessageDispatcher.on(handler);
  }

  public onClose(handler: CloseHandler): Disposable {
    return this.onCloseDispatcher.on(handler);
  }

  public send(data: WebSocketSendData): void {
    if (this.webSocket != null) {
      this.webSocket.send(data);
    }
  }

  private addWebSocketListeners = (
    ws: WebSocket,
    wsId: UUID.UUID,
    resolve: VoidFunction,
    reject: VoidFunction
  ): Disposable => {
    const onOpen = (): void => this.onOpen(resolve);
    const onError = (): void => reject();
    const onClose = (event: CloseEvent): void => this.handleClose(event, wsId);

    ws.addEventListener('message', this.handleMessage);
    ws.addEventListener('open', onOpen);
    ws.addEventListener('error', onError);
    ws.addEventListener('close', onClose);

    return {
      dispose: () => {
        ws.removeEventListener('message', this.handleMessage);
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        ws.removeEventListener('close', onClose);
      },
    };
  };

  private removeWebSocketListeners(webSocketId: UUID.UUID): void {
    this.listeners[webSocketId]?.dispose();
  }

  private handleMessage = (event: MessageEvent): void => {
    this.onMessageDispatcher.emit(event);
  };

  private handleClose = (event: CloseEvent, webSocketId: UUID.UUID): void => {
    this.onCloseDispatcher.emit(event);
    this.removeWebSocketListeners(webSocketId);
  };

  private onOpen(resolve: VoidFunction): void {
    resolve();
  }
}
