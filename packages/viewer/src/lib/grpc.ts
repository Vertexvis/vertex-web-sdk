import { grpc } from '@improbable-eng/grpc-web';

type GrpcCaller<R, E> = (handler: GrpcHandler<R, E>) => void;

type GrpcHandler<R, E> = (err: E | null, res: R | null) => void;

export type JwtProvider = () => string;

export function requestUnary<R, E = unknown>(
  caller: GrpcCaller<R, E>
): Promise<R> {
  return new Promise((resolve, reject) => {
    caller((err, res) => {
      if (err != null) {
        reject(err);
      } else if (res != null) {
        resolve(res);
      } else {
        reject(new Error('Invalid gRPC response. Error and result are empty.'));
      }
    });
  });
}

export function createMetadata(jwtProvider: JwtProvider): grpc.Metadata {
  const jwt = jwtProvider();
  return new grpc.Metadata({
    'jwt-context': JSON.stringify({ jwt }),
  });
}
