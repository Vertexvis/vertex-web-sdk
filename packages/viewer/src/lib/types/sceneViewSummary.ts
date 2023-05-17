import { BoundingBox } from '@vertexvis/geometry';

export interface ItemSetSummary {
  count: number;
  boundingBox?: BoundingBox.BoundingBox;
}

export interface SceneViewSummary {
  visibleSummary: ItemSetSummary;
  selectedVisibleSummary: ItemSetSummary;
}

export function create(data: Partial<SceneViewSummary> = {}): SceneViewSummary {
  return {
    visibleSummary: data.visibleSummary ?? { count: 0 },
    selectedVisibleSummary: data.selectedVisibleSummary ?? { count: 0 },
  };
}
