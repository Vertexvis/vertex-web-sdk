import { vertexvis } from '@vertexvis/frame-streaming-protos';

import type { Mock } from '#test/mock-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createFrameStreamingClientMock(): any {
  return {
    connect: mockConnect(),
    startStream: mockStartStream(),
    createSceneAlteration: mockCreateSceneAlteration(),
  };
}

function mockConnect(): Mock {
  return vi.fn().mockResolvedValue({ dispose: () => {} });
}

function mockStartStream(): Mock {
  const result: vertexvis.protobuf.stream.IStartStreamResult = {
    streamId: { hex: 'stream-id' },
    sceneViewId: { hex: 'scene-view-id' },
  };

  return vi.fn().mockResolvedValue(result);
}

function mockCreateSceneAlteration(): Mock {
  return vi.fn().mockResolvedValue({});
}
