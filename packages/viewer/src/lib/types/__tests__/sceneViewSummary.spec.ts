import { makePerspectiveFrame } from '../../../testing/fixtures';
import { Frame, SceneViewSummary } from '..';

describe('SceneViewSummary', () => {
  describe('SceneViewSummary.copySummaryIfInvalid', () => {
    const baseFrame = makePerspectiveFrame();

    it('copies the summary of the previous frame if the current summary is invalid', () => {
      const previousValid = copyWithValidSummary(baseFrame, 1);
      const previousInvalid = copyWithInvalidSummary(baseFrame);
      const current = copyWithInvalidSummary(baseFrame);

      expect(
        SceneViewSummary.copySummaryIfInvalid(current, previousValid).scene
          .sceneViewSummary
      ).toMatchObject(previousValid.scene.sceneViewSummary);
      expect(
        SceneViewSummary.copySummaryIfInvalid(current, previousInvalid).scene
          .sceneViewSummary
      ).toMatchObject(current.scene.sceneViewSummary);
    });

    it('uses the summary of the current frame if it is valid', () => {
      const previousValid = copyWithValidSummary(baseFrame, 1);
      const previousInvalid = copyWithInvalidSummary(baseFrame);
      const current = copyWithValidSummary(baseFrame, 2);

      expect(
        SceneViewSummary.copySummaryIfInvalid(current, previousValid).scene
          .sceneViewSummary
      ).toMatchObject(current.scene.sceneViewSummary);
      expect(
        SceneViewSummary.copySummaryIfInvalid(current, previousInvalid).scene
          .sceneViewSummary
      ).toMatchObject(current.scene.sceneViewSummary);
    });
  });
});

function copyWithSummary(
  frame: Frame,
  summary?: SceneViewSummary.SceneViewSummary
): Frame {
  return frame.copy({
    scene: frame.scene.copy({
      sceneViewSummary: summary,
    }),
  });
}

function copyWithValidSummary(frame: Frame, count: number): Frame {
  return copyWithSummary(frame, {
    selectedVisibleSummary: {
      count,
    },
    visibleSummary: {
      count,
    },
  });
}

function copyWithInvalidSummary(frame: Frame): Frame {
  return copyWithSummary(frame, {
    selectedVisibleSummary: {
      count: -1,
    },
    visibleSummary: {
      count: -1,
    },
  });
}
