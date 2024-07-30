import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { UUID } from '@vertexvis/utils';
import Long from 'long';

import { drawFramePayloadPerspective } from '../../../testing/fixtures';
import { Orientation } from '../../types';
import { fromPbFrame, fromPbFrameOrThrow } from '../frameStreaming';

describe(fromPbFrame, () => {
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
