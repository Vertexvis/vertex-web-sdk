import { boxQueryCursor } from '../../cursors';
import { InteractionApi } from '../../interactions';
import { VolumeIntersectionQueryController } from '../controller';
import { VolumeIntersectionQueryInteractionHandler } from '../interactions';
import { VolumeIntersectionQueryModel } from '../model';

const InteractionApiMock = InteractionApi as jest.Mock<InteractionApi>;

describe('VolumeIntersectionInteractionHandler', () => {
  it('disposes of resources properly', async () => {
    const viewer = document.createElement('vertex-viewer');
    const model = new VolumeIntersectionQueryModel();
    const controller = new VolumeIntersectionQueryController(model, viewer);
    const handler = new VolumeIntersectionQueryInteractionHandler(controller);

    const mockApi = new InteractionApiMock();

    const addEventListenerSpy = jest.spyOn(viewer, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(viewer, 'removeEventListener');
    const dispose = jest.fn();
    mockApi.addCursor = jest.fn(() => ({ dispose }));

    handler.initialize(viewer, mockApi);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function)
    );
    expect(mockApi.addCursor).toHaveBeenCalledWith(boxQueryCursor);

    handler.dispose();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function)
    );
    expect(dispose).toHaveBeenCalled();
  });
});
