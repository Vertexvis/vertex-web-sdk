import { grpc } from '@improbable-eng/grpc-web';
import {
  Transport,
  TransportOptions,
} from '@improbable-eng/grpc-web/dist/typings/transports/Transport';
import {
  SceneTreeAPI,
  ServiceError,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';

export function isGrpcServiceError(err: any): err is ServiceError {
  return typeof err.code === 'number' && err.hasOwnProperty('metadata');
}

export function webSocketSubscriptionTransportFactory(
  options: TransportOptions
): Transport {
  if (
    options.methodDefinition.methodName === SceneTreeAPI.Subscribe.methodName
  ) {
    return grpc.WebsocketTransport()(options);
  } else {
    return grpc.CrossBrowserHttpTransport({ withCredentials: false })(options);
  }
}
