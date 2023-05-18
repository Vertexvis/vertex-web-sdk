import { BoundingBox } from '@vertexvis/geometry';

import { Frame } from './frame';

export interface ItemSetSummary {
  count: number;
  boundingBox?: BoundingBox.BoundingBox;
}

export interface SceneViewSummary {
  visibleSummary?: ItemSetSummary;
  selectedVisibleSummary?: ItemSetSummary;
}

export function create(data: Partial<SceneViewSummary> = {}): SceneViewSummary {
  return {
    visibleSummary: data.visibleSummary,
    selectedVisibleSummary: data.selectedVisibleSummary,
  };
}

export function copySummaryIfInvalid(current: Frame, previous?: Frame): Frame {
  return isInvalid(current.scene.sceneViewSummary)
    ? current.copy({
        scene: current.scene.copy({
          sceneViewSummary: previous?.scene.sceneViewSummary,
        }),
      })
    : current;
}

function isInvalid(summary: SceneViewSummary): boolean {
  return summary.visibleSummary == null;
}
