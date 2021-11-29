import {
  StreamApi,
  WebSocketClientImpl,
  WebSocketClient,
  ConnectionDescriptor,
  Settings,
} from '@vertexvis/stream-api';
import { Disposable } from '@vertexvis/utils';

export class ViewerStreamApi extends StreamApi {
  // Tracks a period of time with no interaction (requests or responses)
  // indicating that the client has stopped sending or receiving messages
  // and the websocket should be reconnected
  private uninteractiveTimeout?: any;

  // Tracks a period of time after the browser has detected the client
  // has lost internet connection and the websocket should be reconnected
  private offlineTimeout?: any;

  public constructor(
    websocket: WebSocketClient = new WebSocketClientImpl(),
    loggingEnabled = false,
    private uninteractiveThreshold: number = 75 * 1000,
    private offlineThreshold: number = 30 * 1000
  ) {
    super(websocket, { loggingEnabled });

    this.handleOffline = this.handleOffline.bind(this);
    this.handleOnline = this.handleOnline.bind(this);
  }

  public async connect(
    descriptor: ConnectionDescriptor,
    settings: Settings = {}
  ): Promise<Disposable> {
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);

    super.onRequest(() => this.restartUninteractiveTimeout());
    super.onResponse(() => this.restartUninteractiveTimeout());
    this.restartUninteractiveTimeout();

    return super.connect(descriptor, settings);
  }

  public dispose(): void {
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('online', this.handleOnline);
    this.clearUninteractiveTimeout();
    this.clearOfflineTimeout();

    super.dispose();
  }

  private handleOffline(): void {
    this.restartOfflineTimeout();
  }

  private handleOnline(): void {
    this.clearOfflineTimeout();
  }

  private restartOfflineTimeout(): void {
    this.clearOfflineTimeout();
    this.offlineTimeout = setTimeout(() => {
      super.log('Disposing of StreamApi due to loss of network connection.');
      this.dispose();
    }, this.offlineThreshold);
  }

  private clearOfflineTimeout(): void {
    if (this.offlineTimeout != null) {
      clearTimeout(this.offlineTimeout);
      this.offlineTimeout = undefined;
    }
  }

  private restartUninteractiveTimeout(): void {
    this.clearUninteractiveTimeout();
    this.uninteractiveTimeout = setTimeout(() => {
      super.log('Disposing of StreamApi due to lack of interactivity.');
      this.dispose();
    }, this.uninteractiveThreshold);
  }

  private clearUninteractiveTimeout(): void {
    if (this.uninteractiveTimeout != null) {
      clearTimeout(this.uninteractiveTimeout);
      this.uninteractiveTimeout = undefined;
    }
  }
}
