import { Point } from '@vertexvis/geometry';

import { VolumeIntersectionQueryController } from '../controller';
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

    const firstDrag = drag();

    await expect(drag()).rejects.toThrow();

    jest.advanceTimersByTime(500);

    await firstDrag;

    mockExecute.mockImplementation(async () => {
      return;
    });

    await expect(drag()).resolves.toBeUndefined();
  });
});
