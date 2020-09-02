import { vertexvis } from '@vertexvis/frame-streaming-protos';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createFrameStreamingClientMock(): any {
  return {
    connect: mockConnect(),
    startStream: mockStartStream(),
    createSceneAlteration: mockCreateSceneAlteration(),
  };
}

function mockConnect(): jest.Mock<any, any> {
  return jest.fn().mockResolvedValue({ dispose: () => this.dispose() });
}

function mockStartStream(): jest.Mock<any, any> {
  const result: vertexvis.protobuf.stream.IStartStreamResult = {
    streamId: { hex: 'stream-id' },
    sceneViewId: { hex: 'scene-view-id' },
  };

  return jest.fn().mockResolvedValue(result);
}

function mockCreateSceneAlteration(): jest.Mock<any, any> {
  return jest.fn().mockResolvedValue({});
}
/* eslint-enable @typescript-eslint/no-explicit-any */
