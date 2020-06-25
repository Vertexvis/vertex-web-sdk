import { FrameResponse } from '../image-streaming-client';
import { Dimensions, BoundingBox, Vector3 } from '@vertexvis/geometry';
import { Scene, Camera } from '@vertexvis/poc-graphics-3d';

export function createImageStreamingClientMock(): any {
  return {
    connect: mockConnect(),
    loadSceneState: mockLoadSceneState(),
  };
}

function mockConnect(): jest.Mock<any, any> {
  return jest.fn().mockResolvedValue({ dispose: () => this.dispose() });
}

function mockLoadSceneState(): jest.Mock<any, any> {
  const frameResponse: FrameResponse = {
    frame: {
      imageBytes: new Int8Array(100),
      frameAttributes: {
        operationIds: [],
        imageSize: Dimensions.create(100, 100),
        scene: Scene.create(Camera.create(), Dimensions.create(100, 100)),
        visibleBoundingBox: BoundingBox.create(
          Vector3.origin(),
          Vector3.left()
        ),
        renderedBoundingBox: BoundingBox.create(
          Vector3.origin(),
          Vector3.left()
        ),
      },
    },
    type: 'frame',
  };

  return jest.fn().mockResolvedValue(frameResponse);
}
