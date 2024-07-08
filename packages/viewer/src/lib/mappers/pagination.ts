import { Cursor as PBCursor } from '@vertexvis/scene-view-protos/core/protos/paging_pb';
import { Mapper as M } from '@vertexvis/utils';

import { Cursor } from '../types';

export const mapCursor: M.Func<
  PBCursor.AsObject | null | undefined,
  Cursor | undefined
> = M.defineMapper(M.ifDefined(M.getProp('next')), (next) =>
  next != null ? next : undefined
);
