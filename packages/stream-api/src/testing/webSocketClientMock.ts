import {
  WebSocketClient,
  WebSocketSendData,
  MessageHandler,
  CloseHandler,
} from '../webSocketClient';
import { ConnectionDescriptor } from '../connection';
import { Disposable } from '@vertexvis/utils';

export class WebSocketClientMock implements WebSocketClient {
  private closeHandlers = new Set<CloseHandler>();
  private msgHandlers = new Set<MessageHandler>();
  private sentMessages = new Array<WebSocketSendData>();

  public close(): void {
    this.closeHandlers.forEach((handler) => handler(new CloseEvent('close')));
  }

  public connect(descriptor: ConnectionDescriptor): Promise<void> {
    return Promise.resolve();
  }

  public onClose(handler: CloseHandler): Disposable {
    this.closeHandlers.add(handler);
    return { dispose: () => this.closeHandlers.delete(handler) };
  }

  public onMessage(handler: MessageHandler): Disposable {
    this.msgHandlers.add(handler);
    return { dispose: () => this.msgHandlers.delete(handler) };
  }

  public send(data: WebSocketSendData): void {
    this.sentMessages.push(data);
  }

  public reconnect(descriptor: ConnectionDescriptor): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Simulates a websocket message that was sent by the server and received by
   * the client.
   *
   * @param data The websocket message data.
   */
  public receiveMessage(data: WebSocketSendData): void {
    this.msgHandlers.forEach((handler) =>
      handler(new MessageEvent('message', { data }))
    );
  }

  /**
   * Resets the internal state of the mock by clearing any accrued sent messages
   * and removing all handlers.
   */
  public reset(): void {
    this.sentMessages = [];
    this.msgHandlers.clear();
  }

  /**
   * Returns `true` if there are remaining sent messages..
   */
  public hasNextSent(): boolean {
    return this.sentMessages.length > 0;
  }

  /**
   * Decodes and returns the next message that was sent on this websocket.
   *
   * @example
   *
   * const ws = new WebSocketClientMock();
   * const decoder = str => parseInt(str)
   * ws.send("1");
   * ws.send("2");
   *
   * ws.nextSent(decoder); // 1
   * ws.nextSent(decoder); // 2
   *
   * @param decoder A function to decode a message.
   */
  public nextSent<T>(decoder: (data: WebSocketSendData) => T): T;

  /**
   * Returns the next message that was sent on this websocket.
   *
   * @example
   * ```
   * const ws = new WebSocketClientMock();
   * ws.send("1");
   * ws.send("2");
   *
   * ws.nextSent(); // "1"
   * ws.nextSent(); // "2"
   * ```
   */
  public nextSent(): WebSocketSendData;
  public nextSent<T>(
    decoder?: (data: WebSocketSendData) => T
  ): T | WebSocketSendData {
    const next = this.sentMessages.shift();
    if (next != null) {
      if (decoder != null) {
        return decoder(next);
      } else {
        return next;
      }
    } else {
      throw new Error('Sent messages is empty');
    }
  }

  /**
   * Skips the next N sent messages.
   *
   * @example
   * ```
   * const ws = new WebSocketClientMock();
   * ws.send("1");
   * ws.send("2");
   * ws.send("3");
   *
   * ws.skipSent(2);
   * ws.nextSent(); // "3"
   * ```
   *
   * @param n The number of sent messages to skip over.
   */
  public skipSent(n = 1): this {
    if (n <= this.sentMessages.length) {
      for (let i = 0; i < n; i++) {
        this.nextSent();
      }
    } else {
      throw new Error(
        `Cannot skip the next ${n} messages. Sent message queue only has ${this.sentMessages.length} messages.`
      );
    }
    return this;
  }
}
