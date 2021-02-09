import { UUID } from '@vertexvis/utils';
import { StreamApi } from '@vertexvis/stream-api';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

export interface StateLoadOptions {
  sceneViewStateId?: UUID.UUID;
}

export class State {
  public constructor(private stream: StreamApi) {}

  public async load({
    sceneViewStateId,
  }: StateLoadOptions): Promise<
    vertexvis.protobuf.stream.ILoadSceneViewStateResult | undefined
  > {
    if (sceneViewStateId != null) {
      return await this.stream.loadSceneViewState(
        {
          sceneViewStateId: { hex: sceneViewStateId },
        },
        true
      );
    }
  }
}
