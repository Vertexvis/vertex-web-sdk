import { FlexTimeAPIClient } from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/flex_time_api.client';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import {
  GetCompressedGeometryRequest,
  GetCompressedGeometryResponse,
  GetGeometryRequest,
  GetGeometryResponse,
} from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/flex_time_api';
import { ServerStreamingCall } from '@protobuf-ts/runtime-rpc';

export interface GetSceneGeometryRequest {
  sceneId: string;
  sceneViewId?: string;
  sceneItemId?: string;
  excludeSentTriangleSets?: boolean;
}

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
    req: GetSceneGeometryRequest
  ): ServerStreamingCall<GetGeometryRequest, GetGeometryResponse> {
    const newReq: GetGeometryRequest = {
      sceneId: req.sceneId,
      sceneViewId: req.sceneViewId ? { value: req.sceneViewId } : undefined,
      sceneItemId: req.sceneItemId ? { value: req.sceneItemId } : undefined,
      excludeSentTriangleSets: false,
    };
    return this.client.getGeometry(newReq);
  }

  public getCompressedSceneGeometry(
    req: GetSceneGeometryRequest
  ): ServerStreamingCall<
    GetCompressedGeometryRequest,
    GetCompressedGeometryResponse
  > {
    const newReq: GetCompressedGeometryRequest = {
      sceneId: req.sceneId,
      sceneViewId: req.sceneViewId ? { value: req.sceneViewId } : undefined,
      sceneItemId: req.sceneItemId ? { value: req.sceneItemId } : undefined,
      excludeSentTriangleSets: false,
    };
    return this.client.getCompressedGeometry(newReq);
  }
}
