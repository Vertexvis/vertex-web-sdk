import { Mapper as M } from '@vertexvis/utils';

export const toPbBoolValue = toPbScalarWrapper<boolean>();

export const toPbFloatValue = toPbScalarWrapper<number>();

export const fromPbBytesValue = fromPbScalarWrapper<Uint8Array>();

function toPbScalarWrapper<T>(): M.Func<
  T | undefined,
  { value: T | undefined } | undefined
> {
  return M.defineMapper(
    (value) => (value != null ? { value } : undefined),
    (value) => value
  );
}

function fromPbScalarWrapper<T>(): M.Func<
  { value?: T | null } | undefined | null,
  T | undefined
> {
  return M.defineMapper(
    (value) => value?.value || undefined,
    (value) => value
  );
}
