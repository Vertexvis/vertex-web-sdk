import type { Mock } from '#test/mock-types';

import { boxQueryCursor } from '../../cursors';
import { InteractionApi } from '../../interactions';
import { VolumeIntersectionQueryController } from '../controller';
import { VolumeIntersectionQueryInteractionHandler } from '../interactions';
import { VolumeIntersectionQueryModel } from '../model';

const InteractionApiMock = InteractionApi as Mock<InteractionApi>;

describe('VolumeIntersectionInteractionHandler', () => {
  it('disposes of resources properly', async () => {
    const viewer = document.createElement(
      'div',
    ) as unknown as HTMLVertexViewerElement;
    const model = new VolumeIntersectionQueryModel();
    const controller = new VolumeIntersectionQueryController(model, viewer);
    const handler = new VolumeIntersectionQueryInteractionHandler(controller);

    const mockApi = new InteractionApiMock();

    const addEventListenerSpy = vi.spyOn(viewer, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(viewer, 'removeEventListener');
    const dispose = vi.fn();
    mockApi.addCursor = vi.fn(() => ({ dispose }));

    handler.initialize(viewer, mockApi);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
    );
    expect(mockApi.addCursor).toHaveBeenCalledWith(boxQueryCursor);

    handler.dispose();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
    );
    expect(dispose).toHaveBeenCalled();
  });
});
