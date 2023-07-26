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
