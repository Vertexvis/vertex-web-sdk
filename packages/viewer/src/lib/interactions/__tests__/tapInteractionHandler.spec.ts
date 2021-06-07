jest.mock('../interactionApi');
jest.mock('../mouseInteractions');

import { TapInteractionHandler } from '../tapInteractionHandler';
import { InteractionApi } from '../interactionApi';
import { Point } from '@vertexvis/geometry';
import { parseConfig } from '../../config';

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
  const mouseMove1 = new MouseEvent('mousemove', {
    clientX: 15,
    clientY: 15,
  });
  const mouseMove2 = new MouseEvent('mousemove', {
    clientX: 11,
    clientY: 10,
  });
  const touchStart = new Event('touchstart', {
    touches: [{ clientX: 10, clientY: 10, identifier: 1 }],
  } as any);
  const touchEnd = new Event('touchend', {
    touches: [{ clientX: 10, clientY: 10, identifier: 1 }],
  } as any);
  const touchMove1 = new Event('touchmove', {
    touches: [{ clientX: 15, clientY: 15, identifier: 1 }],
  } as any);
  const touchMove2 = new Event('touchmove', {
    touches: [{ clientX: 11, clientY: 10, identifier: 1 }],
  } as any);

  const config = parseConfig('platdev');
  const handler = new TapInteractionHandler(
    'mousedown',
    'mouseup',
    'mousemove',
    () => ({
      ...config,
      events: {
        ...config.events,
        doubleTapThreshold: 15,
        longPressThreshold: 15,
      },
      interactions: {
        ...config.interactions,
        interactionDelay: 10,
      },
    })
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.clearAllTimers();

    handler.initialize(div, api);
  });

  afterEach(() => {
    handler.dispose();
  });

  it('should invoke the tap method of the interaction api provided on mouseup', async () => {
    div.dispatchEvent(mouseDown);
    await delay(5);
    window.dispatchEvent(mouseUp1);

    expect(api.tap).toHaveBeenCalledWith(Point.create(10, 10), keyDetails, 0);
  });

  it('should invoke the tap method of the interaction api provided on touchend', async () => {
    div.dispatchEvent(touchStart);
    await delay(5);
    window.dispatchEvent(touchEnd);

    expect(api.tap).toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should not emit a tap if the ending location is more than 1 pixel away from the starting location', async () => {
    div.dispatchEvent(mouseDown);
    await delay(5);
    window.dispatchEvent(mouseUp2);

    expect(api.tap).not.toHaveBeenCalledWith(
      Point.create(15, 15),
      keyDetails,
      0
    );
  });

  it('should emit a double tap if two taps occur within the configured time period of one another', () => {
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchEnd);
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchEnd);

    expect(api.doubleTap).toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should not emit a double tap if the second tap occurs after the time period', async () => {
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchEnd);
    await delay(50);
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchEnd);

    expect(api.doubleTap).not.toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should emit a double tap if two clicks occur within the configured time period of one another', () => {
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseUp1);
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseUp1);

    expect(api.doubleTap).toHaveBeenCalledWith(
      Point.create(10, 10),
      keyDetails,
      0
    );
  });

  it('should not emit a double tap if the second click occurs after the time period', async () => {
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseUp1);
    await delay(50);
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseUp1);

    expect(api.doubleTap).not.toHaveBeenCalledWith(
      Point.create(10, 10),
      keyDetails,
      0
    );
  });

  it('should not emit a double tap if a touch move has occurred >= 2 pixels away from the touch start and the interaction has begun', async () => {
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchEnd);
    div.dispatchEvent(touchStart);
    await delay(50);
    window.dispatchEvent(touchMove1);
    window.dispatchEvent(touchEnd);

    expect(api.doubleTap).not.toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should emit a double tap at the start location if a touch move has occurred >= 2 pixels away from the touch start and the interaction has not begun', async () => {
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchEnd);
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchMove1);
    window.dispatchEvent(touchEnd);

    expect(api.doubleTap).toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should emit a double tap if a touch move has occurred < 2 pixels away from the touch start', () => {
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchEnd);
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchMove2);
    window.dispatchEvent(touchEnd);

    expect(api.doubleTap).toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should not emit a double tap if a mouse move has occurred >= 2 pixels away from the mouse down and the interaction has begun', async () => {
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseUp1);
    div.dispatchEvent(mouseDown);
    await delay(50);
    window.dispatchEvent(mouseMove1);
    window.dispatchEvent(mouseUp1);

    expect(api.doubleTap).not.toHaveBeenCalledWith(
      Point.create(10, 10),
      keyDetails,
      0
    );
  });

  it('should emit a double tap if a mouse move has occurred < 2 pixels away from the mouse down', async () => {
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseUp1);
    div.dispatchEvent(mouseDown);
    window.dispatchEvent(mouseMove2);
    window.dispatchEvent(mouseUp1);

    expect(api.doubleTap).toHaveBeenCalledWith(
      Point.create(10, 10),
      keyDetails,
      0
    );
  });

  it('should emit a long press if a touch start occurs and a touch end does not occur within the configured time threshold', async () => {
    div.dispatchEvent(touchStart);
    await delay(50);
    window.dispatchEvent(touchEnd);

    expect(api.longPress).toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should not emit a long press if a touch start occurs and a touch end occurs within the configured time threshold', async () => {
    div.dispatchEvent(touchStart);
    await delay(5);
    window.dispatchEvent(touchEnd);

    expect(api.longPress).not.toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should emit a long press if a mouse down occurs and a mouse up does not occur within the configured time threshold', async () => {
    div.dispatchEvent(mouseDown);
    await delay(50);
    window.dispatchEvent(mouseUp1);

    expect(api.longPress).toHaveBeenCalledWith(
      Point.create(10, 10),
      keyDetails,
      0
    );
  });

  it('should not emit a long press if a mouse down occurs and a mouse up occurs within the configured time threshold', async () => {
    div.dispatchEvent(mouseDown);
    await delay(5);
    window.dispatchEvent(mouseUp1);

    expect(api.longPress).not.toHaveBeenCalledWith(
      Point.create(10, 10),
      keyDetails,
      0
    );
  });

  it('should not emit a long press if a touch move has occurred >= 2 pixels away from the touch start and the interaction has begun', async () => {
    div.dispatchEvent(touchStart);
    await delay(10);
    window.dispatchEvent(touchMove1);
    await delay(50);
    window.dispatchEvent(touchEnd);

    expect(api.longPress).not.toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should emit a long press if a touch move has occurred < 2 pixels away from the touch start', async () => {
    div.dispatchEvent(touchStart);
    window.dispatchEvent(touchMove2);
    await delay(50);
    window.dispatchEvent(touchEnd);

    expect(api.longPress).toHaveBeenCalledWith(Point.create(10, 10), {}, 0);
  });

  it('should not emit a long press if a mouse move has occurred >= 2 pixels away from the mouse down', async () => {
    div.dispatchEvent(mouseDown);
    await delay(10);
    window.dispatchEvent(mouseMove1);
    window.dispatchEvent(mouseUp1);

    expect(api.longPress).not.toHaveBeenCalledWith(
      Point.create(10, 10),
      keyDetails,
      0
    );
  });

  it('should emit a long press if a mouse move has occurred < 2 pixels away from the mouse down', async () => {
    div.dispatchEvent(mouseDown);
    await delay(50);
    window.dispatchEvent(mouseMove2);
    window.dispatchEvent(mouseUp1);

    expect(api.longPress).toHaveBeenCalledWith(
      Point.create(10, 10),
      keyDetails,
      0
    );
  });

  function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
});
