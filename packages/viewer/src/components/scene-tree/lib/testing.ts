import { EventDispatcher } from '@vertexvis/utils';
import type {
  ResponseStream,
  Status,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';

export class ResponseStreamMock<T> implements ResponseStream<T> {
  private onData = new EventDispatcher<T>();
  private onStatus = new EventDispatcher<Status>();
  private onEnd = new EventDispatcher<Status | undefined>();

  public cancel(): void {
    // no op
  }

  public on(type: string, handler: any): ResponseStream<T> {
    if (type === 'data') {
      this.onData.on(handler);
    } else if (type === 'end') {
      this.onEnd.on(handler);
    } else {
      this.onStatus.on(handler);
    }
    return this;
  }

  public invokeOnData(msg: T): void {
    this.onData.emit(msg);
  }

  public invokeOnEnd(status?: Status): void {
    this.onEnd.emit(status);
  }

  public invokeOnStatus(status: Status): void {
    this.onStatus.emit(status);
  }
}
