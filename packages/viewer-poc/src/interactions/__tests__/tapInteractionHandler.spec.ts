jest.mock('../interactionApi');
jest.mock('../mouseInteractions');

import { TapInteractionHandler } from '../tapInteractionHandler';
import { InteractionApi } from '../interactionApi';
import { Point } from '@vertexvis/geometry';

const InteractionApiMock = InteractionApi as jest.Mock<InteractionApi>;

describe(TapInteractionHandler, () => {
  const api = new InteractionApiMock();
  const div = document.createElement('div');
  const keyDetails = {
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  };

  const mouseDown = new MouseEvent('mousedown', {
    clientX: 10,
    clientY: 10,
  });
  const mouseUp1 = new MouseEvent('mouseup', {
    clientX: 10,
    clientY: 10,
  });
  const mouseUp2 = new MouseEvent('mouseup', {
    clientX: 15,
    clientY: 15,
  });
  const touchStart = new Event('touchstart', {
    touches: [{ clientX: 10, clientY: 10, identifier: 1 }],
  } as any);
  const touchEnd = new Event('touchend', {
    touches: [{ clientX: 10, clientY: 10, identifier: 1 }],
  } as any);

  const handler = new TapInteractionHandler();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();

    handler.initialize(div, api);
  });

  afterEach(() => {
    handler.dispose();
  });

  it('should invoke the tap method of the interaction api provided on mouseup', () => {
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseUp1);

    expect(api.tap).toHaveBeenCalledWith(Point.create(10, 10), keyDetails);
  });

  it('should invoke the tap method of the interaction api provided on touchend', () => {
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchEnd);

    expect(api.tap).toHaveBeenCalledWith(Point.create(10, 10), {});
  });

  it('should not emit a tap if the ending location is more than 1 pixel away from the starting location', () => {
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseUp2);

    expect(api.tap).not.toHaveBeenCalledWith(Point.create(15, 15), keyDetails);
  });
});
