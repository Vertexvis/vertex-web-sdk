import { grpc } from '@improbable-eng/grpc-web';

export type GrpcCaller<R, E> = (
  handler: GrpcHandler<R, E>
) => void | Promise<void>;

type GrpcHandler<R, E> = (err: E | null, res: R | null) => void | Promise<void>;

export type JwtProvider = () =>
  | Promise<string | undefined>
  | string
  | undefined;

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

export async function* requestPaged<R, E = unknown>(
  fetch: (cursor: string | undefined) => GrpcCaller<R, E>,
  next: (res: R) => string | undefined
): AsyncGenerator<R, void, void> {
  let cursor = undefined;

  do {
    const res = await requestUnary(fetch(cursor));
    yield res;
    cursor = next(res);
  } while (cursor != null);
}

export async function createMetadata(
  jwtProvider: JwtProvider,
  deviceId?: string
): Promise<grpc.Metadata> {
  const jwt = await jwtProvider();
  const meta = new grpc.Metadata({
    'jwt-context': JSON.stringify({
      jwt,
      metadata: { 'x-device-id': deviceId || '' },
    }),
  });

  return meta;
}
