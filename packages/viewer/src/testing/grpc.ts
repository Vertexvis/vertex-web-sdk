export function mockGrpcUnaryResult(
  result: unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (...args: any[]) => unknown {
  return (_, __, handler) => {
    setTimeout(() => {
      handler(null, result);
    }, 10);
  };
}

export function mockGrpcUnaryError(
  error: unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (...args: any[]) => unknown {
  return (_, __, handler) => {
    setTimeout(() => {
      handler(error);
    }, 10);
  };
}
