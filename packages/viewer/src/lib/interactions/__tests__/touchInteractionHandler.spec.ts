jest.mock('../interactionApiPerspective');
jest.mock('../mouseInteractions');

import { Point } from '@vertexvis/geometry';

import { InteractionApiPerspective } from '../interactionApiPerspective';
import { TouchInteractionHandler } from '../touchInteractionHandler';

const InteractionApiMock =
  InteractionApiPerspective as jest.Mock<InteractionApiPerspective>;

describe(TouchInteractionHandler, () => {
  const api = new InteractionApiMock();
  const div = document.createElement('div');

  const touchStart1 = new Event('touchstart', {
    touches: [{ screenX: 20, screenY: 10, identifier: 1 }],
  } as unknown as EventInit);
  const touchStart2 = new Event('touchstart', {
    touches: [
      { screenX: 20, screenY: 10, identifier: 1 },
      { screenX: 40, screenY: 20, identifier: 2 },
    ],
  } as unknown as EventInit);
  const touchMoveWithOneFingerTouch = new Event('touchmove', {
    touches: [{ screenX: 25, screenY: 15, identifier: 1 }],
  } as unknown as EventInit);
  const touchMoveWithTwoFingerTouch = new Event('touchmove', {
    touches: [
      { screenX: 25, screenY: 15, identifier: 1 },
      { screenX: 45, screenY: 25, identifier: 2 },
    ],
  } as unknown as EventInit);
  const touchEnd1 = new Event('touchend', {
    touches: [],
  } as unknown as EventInit);

  const handler = new TouchInteractionHandler();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();

    handler.initialize(div, api);
  });

  afterEach(() => {
    handler.dispose();
  });

  it('performs a rotate interaction with a single touch movement more than 2 pixels', () => {
    div.dispatchEvent(touchStart1);
    window.dispatchEvent(touchMoveWithOneFingerTouch);
    window.dispatchEvent(touchEnd1);

    expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    expect(api.rotateCamera).toHaveBeenCalledWith(Point.create(5, 5));
    expect(api.endInteraction).toHaveBeenCalledTimes(1);
  });

  it('ignores rotate interaction with movement less than 2 pixels', () => {
    const touchMove = new Event('touchmove', {
      touches: [{ screenX: 21, screenY: 11, identifier: 1 }],
    } as unknown as EventInit);
    div.dispatchEvent(touchStart1);
    window.dispatchEvent(touchMove);
    window.dispatchEvent(touchEnd1);

    expect(api.beginInteraction).not.toHaveBeenCalled();
  });

  it('performs a pan and zoom with a two finger touch', () => {
    div.dispatchEvent(touchStart2);
    window.dispatchEvent(touchMoveWithTwoFingerTouch);
    window.dispatchEvent(touchEnd1);

    expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    expect(api.panCameraByDelta).toHaveBeenCalledTimes(1);
    expect(api.zoomCamera).toHaveBeenCalledTimes(1);
    expect(api.endInteraction).toHaveBeenCalledTimes(1);
  });

  it('should not handle events after touch end', () => {
    div.dispatchEvent(touchStart1);
    window.dispatchEvent(touchMoveWithOneFingerTouch);
    window.dispatchEvent(touchEnd1);

    window.dispatchEvent(touchMoveWithOneFingerTouch);

    expect(api.rotateCamera).toHaveBeenCalledTimes(1);
  });

  describe(TouchInteractionHandler.prototype.dispose, () => {
    it('should not handle events if disposed', () => {
      handler.dispose();

      div.dispatchEvent(touchStart1);
      window.dispatchEvent(touchMoveWithOneFingerTouch);
      window.dispatchEvent(touchEnd1);

      expect(api.beginInteraction).not.toHaveBeenCalled();
    });
  });
});
