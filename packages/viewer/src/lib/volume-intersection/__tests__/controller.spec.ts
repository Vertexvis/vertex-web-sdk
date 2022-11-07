import { Point } from '@vertexvis/geometry';

import {
  DEFAULT_CONCURRENT_VOLUME_QUERY_LIMIT,
  VolumeIntersectionQueryController,
} from '../controller';
import { VolumeIntersectionQueryModel } from '../model';

describe('volume intersection controller', () => {
  const mockQuery = {
    withVolumeIntersection: jest.fn(),
  };
  const mockBuilder = {
    where: (fn) => {
      fn(mockQuery);
      return { select: jest.fn() };
    },
  };
  const mockExecute = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
  const model = new VolumeIntersectionQueryModel();
  const mockViewer = {
    scene: () => ({
      items: (fn) => {
        fn(mockBuilder);
        return {
          execute: mockExecute,
        };
      },
    }),
  };

  it('limits the number of in flight operations', async () => {
    jest.useFakeTimers();

    const controller = new VolumeIntersectionQueryController(
      model,
      mockViewer as unknown as HTMLVertexViewerElement
    );

    async function drag(): Promise<void> {
      controller.setStartPoint(Point.create(1, 1));
      controller.setEndPoint(Point.create(2, 2));
      return controller.execute();
    }

    const promises = new Array(DEFAULT_CONCURRENT_VOLUME_QUERY_LIMIT)
      .fill(undefined)
      .map(() => drag());

    await expect(drag()).rejects.toThrow();

    jest.advanceTimersByTime(500);

    await Promise.all(promises);

    mockExecute.mockImplementation(async () => {
      return;
    });

    await expect(drag()).resolves.toBeUndefined();
  });
});
