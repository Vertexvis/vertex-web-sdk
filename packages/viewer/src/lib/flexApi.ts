import { FlexTimeAPIClient } from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/flex_time_api.client';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import {
  GetGeometryRequest,
  GetGeometryResponse,
} from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/flex_time_api';
import { ServerStreamingCall } from '@protobuf-ts/runtime-rpc';

export class FlexTimeApi {
  public constructor(private readonly client: FlexTimeAPIClient) {}

  public static create(host: string): FlexTimeApi {
    const transport = new GrpcWebFetchTransport({
      baseUrl: host,
      format: 'binary',
    });
    return new FlexTimeApi(new FlexTimeAPIClient(transport));
  }

  public getSceneGeometry(
    sceneId: string
  ): ServerStreamingCall<GetGeometryRequest, GetGeometryResponse> {
    const req: GetGeometryRequest = { sceneId };
    return this.client.getGeometry(req);
  }

  public getSceneItemGeometry(
    sceneId: string,
    viewId: string,
    itemId: string
  ): ServerStreamingCall<GetGeometryRequest, GetGeometryResponse> {
    const req: GetGeometryRequest = {
      sceneId: sceneId,
      sceneViewId: { value: viewId },
      sceneItemId: { value: itemId },
    };

    return this.client.getGeometry(req);
  }
}
