import { BoundingBox } from '@vertexvis/geometry';

export interface ItemSetSummary {
  count: number;
  boundingBox?: BoundingBox.BoundingBox;
}

export interface DisplayListSummary {
  visibleSummary: ItemSetSummary;
  selectedVisibleSummary: ItemSetSummary;
}

export function create(
  data: Partial<DisplayListSummary> = {}
): DisplayListSummary {
  return {
    visibleSummary: data.visibleSummary ?? { count: 0 },
    selectedVisibleSummary: data.selectedVisibleSummary ?? { count: 0 },
  };
}
