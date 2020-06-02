import { vertexvis } from '@vertexvis/frame-stream-protos';

export function createFrameStreamingClientMock(): any {
  return {
    connect: mockConnect(),
    startStream: mockStartStream(),
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
