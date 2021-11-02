import { Mapper as M } from '@vertexvis/utils';
import type { google } from '@vertexvis/frame-streaming-protos';

export const toPbBoolValue: M.Func<
  boolean | undefined,
  google.protobuf.IBoolValue | undefined
> = M.defineMapper(
  (bool) => (bool != null ? { value: bool } : undefined),
  (bool) => bool
);

export const toPbFloatValue: M.Func<
  number | undefined,
  google.protobuf.IFloatValue | undefined
> = M.defineMapper(
  (value) => (value != null ? { value } : undefined),
  (value) => value
);
