import { vertexvis } from '@vertexvis/frame-streaming-protos';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createFrameStreamingClientMock(): any {
  return {
    connect: mockConnect(),
    startStream: mockStartStream(),
    createSceneAlteration: mockCreateSceneAlteration(),
  };
}

function mockConnect(): jest.Mock {
  return jest.fn().mockResolvedValue({ dispose: () => {}});
}

function mockStartStream(): jest.Mock {
  const result: vertexvis.protobuf.stream.IStartStreamResult = {
    streamId: { hex: 'stream-id' },
    sceneViewId: { hex: 'scene-view-id' },
  };

  return jest.fn().mockResolvedValue(result);
}

function mockCreateSceneAlteration(): jest.Mock {
  return jest.fn().mockResolvedValue({});
}
