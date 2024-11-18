import { Point } from '@vertexvis/geometry';
import { StreamRequestError } from '@vertexvis/stream-api';

import { VolumeIntersectionQueryController } from '../controller';
import { VolumeIntersectionQueryModel } from '../model';

describe('volume intersection controller', () => {
  const mockQuery = {
    withVolumeIntersection: jest.fn(),
    all: jest.fn(),
    withItemId: jest.fn(),
  };
  const mockOperations = {
    select: jest.fn(),
    deselect: jest.fn(),
    materialOverride: jest.fn(),
  };
  const mockBuilder = {
    where: (fn) => {
      fn(mockQuery);
      return mockOperations;
    },
  };
  const mockExecute = jest.fn();
  const model = new VolumeIntersectionQueryModel();
  const mockViewer = {
    scene: () => ({
      elements: (fn) => {
        fn(mockBuilder);
        return {
          execute: mockExecute,
        };
      },
    }),
  };

  async function drag(
    controller: VolumeIntersectionQueryController
  ): Promise<void> {
    controller.setStartPoint(Point.create(1, 1));
    controller.setEndPoint(Point.create(5, 5));
    return controller.execute();
  }

  beforeEach(() => {
    mockExecute.mockReset();
    jest.clearAllMocks();
  });

  it('limits the number of in flight operations', async () => {
    jest.useFakeTimers();

    mockExecute.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    const controller = new VolumeIntersectionQueryController(
      model,
      mockViewer as unknown as HTMLVertexViewerElement
    );

    const firstDrag = drag(controller);

    await expect(drag(controller)).rejects.toThrow();

    jest.advanceTimersByTime(500);

    await firstDrag;

    mockExecute.mockImplementation(async () => {
      return;
    });

    await expect(drag(controller)).resolves.toBeUndefined();
  });

  it('supports changing the base operation', async () => {
    const controller = new VolumeIntersectionQueryController(
      model,
      mockViewer as unknown as HTMLVertexViewerElement
    );

    controller.setOperationTransform((builder) =>
      builder.materialOverride('#ff0000')
    );

    await drag(controller);

    expect(mockOperations.materialOverride).toHaveBeenCalledWith('#ff0000');
  });

  it('supports changing the additional operations', async () => {
    const controller = new VolumeIntersectionQueryController(
      model,
      mockViewer as unknown as HTMLVertexViewerElement
    );

    controller.setAdditionalTransforms([
      (op) => op.where((q) => q.withItemId('id')).materialOverride('#00ff00'),
    ]);

    await drag(controller);

    expect(mockQuery.all).not.toHaveBeenCalled();
    expect(mockQuery.withItemId).toHaveBeenCalledWith('id');
    expect(mockOperations.materialOverride).toHaveBeenCalledWith('#00ff00');
  });

  it('indicates when the operation has been aborted', async () => {
    const requestError = new StreamRequestError(
      'request-id',
      {},
      'Operation aborted.',
      undefined
    );

    mockExecute.mockImplementation(async () => {
      await new Promise((_resolve, reject) => reject(requestError));
    });

    const controller = new VolumeIntersectionQueryController(
      model,
      mockViewer as unknown as HTMLVertexViewerElement
    );

    const handleExecuteAborted = jest.fn();
    const handleExecuteComplete = jest.fn();
    controller.onExecuteAborted(handleExecuteAborted);
    controller.onExecuteComplete(handleExecuteComplete);

    await drag(controller);

    expect(handleExecuteAborted).toHaveBeenCalledWith(requestError);
    expect(handleExecuteComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        aborted: true,
      })
    );
  });
});
