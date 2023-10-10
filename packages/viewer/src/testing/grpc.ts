import { UnaryResponse } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';

export function mockGrpcUnaryResult(
  result: unknown,
  timeout = 10
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (...args: any[]) => unknown {
  return (_, __, handler) => {
    setTimeout(() => {
      handler(null, result);
    }, timeout);
  };
}

export function mockCancellableGrpcUnaryResult(
  result: unknown,
  timeout = 10,
  onCancel?: VoidFunction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (...args: any[]) => unknown {
  return (_, __, handler): UnaryResponse => {
    const timer = setTimeout(() => {
      handler(null, result);
    }, timeout);

    return {
      cancel: () => {
        clearTimeout(timer);
        onCancel?.();
      },
    };
  };
}

export function mockGrpcUnaryError(
  error: unknown,
  timeout = 10
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (...args: any[]) => unknown {
  return (_, __, handler) => {
    setTimeout(() => {
      handler(error);
    }, timeout);
  };
}
