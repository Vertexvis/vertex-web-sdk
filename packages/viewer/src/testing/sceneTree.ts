import { EventDispatcher } from '@vertexvis/utils';
import type {
  ResponseStream,
  Status,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { GetTreeResponse } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { OffsetCursor } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { random } from './random';

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

export function createGetTreeResponse(
  itemCount: number,
  totalCount: number | null,
  transform?: (node: Node) => void
): GetTreeResponse {
  const nodes = Array.from({ length: itemCount }).map((_, i) => {
    const id = new Uuid();
    id.setHex(random.guid());
    const node = new Node();
    node.setId(id);
    node.setDepth(0);
    node.setExpanded(false);
    node.setIsLeaf(false);
    node.setName(random.string());
    node.setSelected(false);
    node.setVisible(false);
    transform?.(node);
    return node;
  });

  const cursor = new OffsetCursor();
  if (totalCount != null) {
    cursor.setTotal(totalCount);
  }

  const res = new GetTreeResponse();
  res.setItemsList(nodes);
  res.setCursor(cursor);

  return res;
}
