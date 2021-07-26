import {
  CompressedRenderItem,
  RenderItem,
} from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/domain';

export function isCompressedRenderItem(
  item: RenderItem | CompressedRenderItem
): item is CompressedRenderItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (item as any).hasOwnProperty('dracoBytes');
}
