import { Mapper as M } from '@vertexvis/utils';
import type { google } from '@vertexvis/frame-streaming-protos';

export const toPbOptionalBoolean: M.Func<
  boolean | undefined,
  google.protobuf.IBoolValue | undefined
> = M.defineMapper(
  (bool) => (bool != null ? { value: bool } : undefined),
  (bool) => bool
);
