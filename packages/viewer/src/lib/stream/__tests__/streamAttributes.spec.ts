import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { toProtoStreamAttributes } from '../streamAttributes';

describe(toProtoStreamAttributes, () => {
  describe('protobuf value mapping', () => {
    it('correctly wraps primitive values', () => {
      expect(
        toProtoStreamAttributes({
          experimentalGhosting: {
            opacity: 0.2,
            enabled: true,
          },
        })
      ).toMatchObject({
        experimentalGhosting: {
          opacity: { value: 0.2 },
          enabled: { value: true },
        },
      });
    });

    it('does not wrap protobuf values', () => {
      expect(
        toProtoStreamAttributes({
          experimentalGhosting: {
            opacity: { value: 0.2 },
            enabled: true,
          },
        })
      ).toMatchObject({
        experimentalGhosting: {
          opacity: { value: 0.2 },
          enabled: { value: true },
        },
      });
    });
  });

  describe('depth values', () => {
    it('assigns the correct type of frames', () => {
      expect(
        toProtoStreamAttributes({
          depthBuffers: {
            frameType: 'final',
            enabled: { value: true },
          },
        })
      ).toMatchObject({
        depthBuffers: {
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_FINAL,
          enabled: { value: true },
        },
      });
    });

    it('returns invalid for any value that is not supported', () => {
      const depthBuffers: any = {
        frameType: 'unsupported-type',
        enabled: { value: true },
      };

      expect(
        toProtoStreamAttributes({
          depthBuffers,
        })
      ).toMatchObject({
        depthBuffers: {
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_INVALID,
          enabled: { value: true },
        },
      });
    });

    it('preserves existing attributes', () => {
      expect(
        toProtoStreamAttributes({
          experimentalGhosting: {
            enabled: { value: true },
          },
          depthBuffers: {
            frameType: 'final',
            enabled: { value: true },
          },
        })
      ).toMatchObject({
        experimentalGhosting: {
          enabled: { value: true },
        },
        depthBuffers: {
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_FINAL,
          enabled: { value: true },
        },
      });
    });
  });
});
