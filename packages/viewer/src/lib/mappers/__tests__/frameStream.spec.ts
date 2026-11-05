import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { UUID } from '@vertexvis/utils';
import Long from 'long';

import { drawFramePayloadPerspective } from '../../../testing/fixtures';
import { Orientation } from '../../types';
import { fromPbFrameOrThrow, fromPbWorldOrientation } from '../frameStreaming';

describe('fromPbFrameOrThrow', () => {
  it('should decode model view id', () => {
    const id = UUID.create();
    const msbLsb = UUID.toMsbLsb(id);

    const payload: vertexvis.protobuf.stream.IDrawFramePayload = {
      ...drawFramePayloadPerspective,
      sceneAttributes: {
        ...drawFramePayloadPerspective.sceneAttributes,
        modelViewId: {
          msb: Long.fromString(msbLsb.msb),
          lsb: Long.fromString(msbLsb.lsb),
        },
      },
    };

    const frame = fromPbFrameOrThrow(Orientation.DEFAULT)(payload);
    expect(frame.scene.modelViewId).toBe(id);
  });
});

describe('fromPbWorldOrientation', () => {
  it('should decode a right-handed orientation', () => {
    const payload: vertexvis.protobuf.stream.IOrientation = {
      up: {
        x: 1,
        y: 0,
        z: 0,
      },
      front: {
        x: 0,
        y: -1,
        z: 0,
      },
      isLeftHanded: {
        value: false,
      },
    };

    const orientation = fromPbWorldOrientation(payload);

    expect(orientation).toMatchObject({
      x: {
        x: 0,
        y: 0,
        z: -1,
      },
      y: {
        x: 1,
        y: 0,
        z: 0,
      },
      z: {
        x: 0,
        y: -1,
        z: 0,
      },
    });
  });

  it('should decode a left-handed orientation', () => {
    const payload: vertexvis.protobuf.stream.IOrientation = {
      up: {
        x: 1,
        y: 0,
        z: 0,
      },
      front: {
        x: 0,
        y: -1,
        z: 0,
      },
      isLeftHanded: {
        value: true,
      },
    };

    const orientation = fromPbWorldOrientation(payload);
    expect(orientation).toMatchObject({
      x: {
        x: -0,
        y: -0,
        z: 1,
      },
      y: {
        x: 1,
        y: 0,
        z: 0,
      },
      z: {
        x: 0,
        y: -1,
        z: 0,
      },
    });
  });
});
