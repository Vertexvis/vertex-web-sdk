import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Color } from '@vertexvis/utils';

import { toPbStreamAttributes } from '../streamAttributes';

describe(toPbStreamAttributes, () => {
  describe('depth buffer', () => {
    it('enables depth buffer if type is all', () => {
      const res = toPbStreamAttributes({ depthBuffers: 'all' });
      expect(res).toMatchObject({
        depthBuffers: expect.objectContaining({
          enabled: { value: true },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_ALL,
        }),
      });
    });

    it('enables depth buffer if type is final', () => {
      const res = toPbStreamAttributes({ depthBuffers: 'final' });
      expect(res).toMatchObject({
        depthBuffers: expect.objectContaining({
          enabled: { value: true },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_FINAL,
        }),
      });
    });

    it('disables depth buffer if not valid type', () => {
      const res = toPbStreamAttributes({ depthBuffers: undefined });
      expect(res).toMatchObject({
        depthBuffers: expect.objectContaining({
          enabled: { value: false },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_INVALID,
        }),
      });
    });
  });

  describe('feature map', () => {
    it('enables feature map if type is all', () => {
      const res = toPbStreamAttributes({ featureMaps: 'all' });
      expect(res).toMatchObject({
        featureMaps: expect.objectContaining({
          enabled: { value: true },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_ALL,
        }),
      });
    });

    it('enables depth buffer if type is final', () => {
      const res = toPbStreamAttributes({ featureMaps: 'final' });
      expect(res).toMatchObject({
        featureMaps: expect.objectContaining({
          enabled: { value: true },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_FINAL,
        }),
      });
    });

    it('disables depth buffer if not valid type', () => {
      const res = toPbStreamAttributes({ featureMaps: undefined });
      expect(res).toMatchObject({
        featureMaps: expect.objectContaining({
          enabled: { value: false },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_INVALID,
        }),
      });
    });
  });

  describe('phantom', () => {
    it('clamps opacity to [0, 1]', () => {
      const res1 = toPbStreamAttributes({ phantom: { opacity: 2 } });
      const res2 = toPbStreamAttributes({ phantom: { opacity: -1 } });
      expect(res1).toMatchObject({
        phantomItems: expect.objectContaining({
          opacity: { value: 1 },
        }),
      });
      expect(res2).toMatchObject({
        phantomItems: expect.objectContaining({
          opacity: { value: 0 },
        }),
      });
    });
  });

  describe('feature lines', () => {
    it('enables feature line if set', () => {
      const res = toPbStreamAttributes({
        featureLines: { width: 1, color: 0xff0000 },
      });
      expect(res).toMatchObject({
        featureLines: { lineWidth: 1, lineColor: { r: 255, g: 0, b: 0 } },
      });
    });
  });

  describe('selection highlighting', () => {
    it('should support changing the default halo highlighting parameters', () => {
      const res = toPbStreamAttributes({
        selectionHighlighting: { lineWidth: 2, color: 0xff0000, opacity: 0.25 },
      });
      expect(res).toMatchObject({
        selectionHighlighting: {
          lineWidth: 2,
          color: { r: 255, g: 0, b: 0 },
          opacity: {
            value: 0.25,
          },
        },
      });
    });
  });

  describe('feature highlighting', () => {
    it('enables feature highlighting if set', () => {
      const res = toPbStreamAttributes({
        featureHighlighting: {
          highlightColor: 0xff0000,
          occludedOpacity: 0.5,
          outline: { width: 2, color: 0x00ff00 },
        },
      });
      expect(res).toMatchObject({
        featureHighlighting: {
          highlightColor: { r: 255, g: 0, b: 0 },
          occludedOpacity: { value: 0.5 },
          outline: { lineWidth: 2, lineColor: { r: 0, g: 255, b: 0 } },
        },
      });
    });
  });

  describe('frame options', () => {
    it('should support changing the background color', () => {
      const res = toPbStreamAttributes({
        frames: {
          frameBackgroundColor: Color.create(1, 2, 3),
        },
      });
      expect(res).toMatchObject({
        frames: {
          frameBackgroundColor: {
            r: 1,
            g: 2,
            b: 3,
          },
        },
      });
    });
  });

  describe('scene comparison', () => {
    it('enables comparing scenes if set', () => {
      const streamKey = 'test';

      const res = toPbStreamAttributes({
        sceneComparison: {
          streamKeyToCompare: streamKey,
        },
      });
      expect(res).toMatchObject({
        sceneComparison: {
          streamKeyToCompare: { value: streamKey },
        },
      });
    });
  });
});
