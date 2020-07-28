import { vertexvis } from '@vertexvis/frame-streaming-protos';

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
  const frameResponse: vertexvis.protobuf.stream.IFrameResult = {
    image: new Uint8Array(100),
  };

  return jest.fn().mockResolvedValue(frameResponse);
}

function mockCreateSceneAlteration(): jest.Mock<any, any> {
  return jest.fn().mockResolvedValue({});
}
