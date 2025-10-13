jest.mock('../interactionApi');
jest.mock('../interactionApiPerspective');

import { Point } from '@vertexvis/geometry';

import {
  defaultInteractionConfig,
  InteractionConfig,
} from '../../types/interactions';
import { InteractionApi } from '../interactionApi';
import { InteractionApiPerspective } from '../interactionApiPerspective';
import {
  PanInteraction,
  RotateInteraction,
  TwistInteraction,
  ZoomInteraction,
} from '../mouseInteractions';

const InteractionApiMock = InteractionApi as jest.Mock<InteractionApi>;
const element = document.createElement('canvas');

beforeEach(() => {
  jest.resetAllMocks();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe(RotateInteraction, () => {
  const api = new InteractionApiMock();

  const event1 = new MouseEvent('mousemove', { screenX: 10, screenY: 5 });
  const event2 = new MouseEvent('mousemove', { screenX: 15, screenY: 10 });
  const event3 = new MouseEvent('mousemove', { screenX: 25, screenY: 20 });

  const canvasPoint = Point.create(0, 0);

  describe(RotateInteraction.prototype.beginDrag, () => {
    it('begins interaction once for multiple begin drag calls', () => {
      const interaction = new RotateInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.beginDrag(event1, canvasPoint, api);
      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(RotateInteraction.prototype.drag, () => {
    it('first drag rotates camera using delta between begin drag and drag', () => {
      const interaction = new RotateInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.drag(event2, api);

      expect(api.rotateCamera).toHaveBeenCalledWith(Point.create(5, 5));
    });

    it('continuous drags rotate camera using delta between calls', () => {
      const interaction = new RotateInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.drag(event2, api);
      interaction.drag(event3, api);

      expect(api.rotateCamera).toHaveBeenNthCalledWith(2, Point.create(10, 10));
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new RotateInteraction();
      interaction.drag(event1, api);

      expect(api.rotateCamera).not.toHaveBeenCalled();
    });
  });

  describe(RotateInteraction.prototype.endDrag, () => {
    it('ends interaction if begin drag has been called', () => {
      const interaction = new RotateInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.endDrag(event1, api);

      expect(api.endInteraction).toHaveBeenCalledTimes(1);
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new RotateInteraction();
      interaction.endDrag(event1, api);

      expect(api.endInteraction).not.toHaveBeenCalled();
    });
  });
});

describe(PanInteraction, () => {
  const api = new InteractionApiMock();

  const event1 = new MouseEvent('mousemove', { clientX: 10, clientY: 5 });
  const event2 = new MouseEvent('mousemove', { clientX: 15, clientY: 10 });
  const event3 = new MouseEvent('mousemove', { clientX: 25, clientY: 20 });

  const canvasPoint = Point.create(0, 0);

  describe(PanInteraction.prototype.beginDrag, () => {
    it('begins interaction once for multiple begin drag calls', () => {
      const interaction = new PanInteraction();
      interaction.beginDrag(event1, canvasPoint, api, element);
      interaction.beginDrag(event1, canvasPoint, api, element);

      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(PanInteraction.prototype.drag, () => {
    it('pans camera using mouse position', () => {
      const interaction = new PanInteraction();
      interaction.beginDrag(event1, canvasPoint, api, element);
      interaction.drag(event2, api);

      expect(api.panCameraToScreenPoint).toHaveBeenCalledWith(
        Point.create(15, 10)
      );
    });

    it('continuous drags rotate camera using delta between calls', () => {
      const interaction = new PanInteraction();
      interaction.beginDrag(event1, canvasPoint, api, element);
      interaction.drag(event2, api);
      interaction.drag(event3, api);

      expect(api.panCameraToScreenPoint).toHaveBeenNthCalledWith(
        2,
        Point.create(25, 20)
      );
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new PanInteraction();
      interaction.drag(event1, api);

      expect(api.panCameraToScreenPoint).not.toHaveBeenCalled();
    });
  });

  describe(PanInteraction.prototype.endDrag, () => {
    it('ends interaction if begin drag has been called', () => {
      const interaction = new PanInteraction();
      interaction.beginDrag(event1, canvasPoint, api, element);
      interaction.endDrag(event1, api);

      expect(api.endInteraction).toHaveBeenCalledTimes(1);
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new PanInteraction();
      interaction.endDrag(event1, api);

      expect(api.endInteraction).not.toHaveBeenCalled();
    });
  });
});

describe(ZoomInteraction, () => {
  const api =
    new (InteractionApiPerspective as jest.Mock<InteractionApiPerspective>)();

  const defaultConfigProvider = (): InteractionConfig => ({
    ...defaultInteractionConfig,
  });

  const event1 = new MouseEvent('mousemove', { clientX: 10, clientY: 5 });
  const event2 = new MouseEvent('mousemove', { clientX: 15, clientY: 10 });
  const event3 = new MouseEvent('mousemove', { clientX: 25, clientY: 20 });

  const canvasPoint = Point.create(0, 0);

  describe(ZoomInteraction.prototype.beginDrag, () => {
    it('begins interaction once for multiple begin drag calls', () => {
      const interaction = new ZoomInteraction(defaultConfigProvider);
      interaction.beginDrag(event1, canvasPoint, api, element);
      interaction.beginDrag(event1, canvasPoint, api, element);

      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(ZoomInteraction.prototype.drag, () => {
    it('first drag zooms camera using delta between begin drag and drag', () => {
      const interaction = new ZoomInteraction(defaultConfigProvider);
      interaction.beginDrag(event1, canvasPoint, api, element);
      interaction.drag(event2, api);

      const pt = Point.create(event1.clientX, event1.clientY);
      expect(api.zoomCameraToPoint).toHaveBeenCalledWith(pt, 5);
    });

    it('continuous drags zoom camera using delta between calls', () => {
      const interaction = new ZoomInteraction(defaultConfigProvider);
      interaction.beginDrag(event1, canvasPoint, api, element);
      interaction.drag(event2, api);
      interaction.drag(event3, api);

      const pt = Point.create(event1.clientX, event1.clientY);
      expect(api.zoomCameraToPoint).toHaveBeenNthCalledWith(2, pt, 10);
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new ZoomInteraction(defaultConfigProvider);
      interaction.drag(event1, api);

      expect(api.zoomCamera).not.toHaveBeenCalled();
    });

    it('supports customizing the zoom direction by inverting the delta', async () => {
      jest.useFakeTimers();

      const interaction = new ZoomInteraction(() => ({
        ...defaultInteractionConfig,
        reverseMouseWheelDirection: true,
      }));
      await interaction.zoom(10, api);

      jest.advanceTimersToNextTimer();

      expect(api.zoomCamera).toHaveBeenCalledWith(-10);

      jest.useRealTimers();
    });

    it('supports customizing the zoomToPoint direction by inverting the delta', async () => {
      jest.useFakeTimers();

      const interaction = new ZoomInteraction(() => ({
        ...defaultInteractionConfig,
        reverseMouseWheelDirection: true,
      }));
      const pt = Point.create(event1.clientX, event1.clientY);
      await interaction.zoomToPoint(pt, 10, api);

      jest.advanceTimersToNextTimer();

      expect(api.zoomCameraToPoint).toHaveBeenCalledWith(pt, -10);

      jest.useRealTimers();
    });
  });

  describe(ZoomInteraction.prototype.endDrag, () => {
    it('ends interaction if begin drag has been called', () => {
      const interaction = new ZoomInteraction(defaultConfigProvider);
      interaction.beginDrag(event1, canvasPoint, api, element);
      interaction.endDrag(event1, api);

      expect(api.endInteraction).toHaveBeenCalledTimes(1);
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new ZoomInteraction(defaultConfigProvider);
      interaction.endDrag(event1, api);

      expect(api.endInteraction).not.toHaveBeenCalled();
    });
  });

  describe(ZoomInteraction.prototype.zoom, () => {
    const timeoutDelay = 50;

    const interactionConfigProvider = (): InteractionConfig => {
      return {
        ...defaultInteractionConfig,
        mouseWheelInteractionEndDebounce: timeoutDelay,
      };
    };
    function delay(): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, timeoutDelay + 10));
    }

    it('only begins interaction once within interaction timeout', async () => {
      const interaction = new ZoomInteraction(interactionConfigProvider);
      interaction.zoom(1, api);
      interaction.zoom(1, api);

      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
      await delay();
    });

    it('ends interaction after interaction timeout', async () => {
      const interaction = new ZoomInteraction(interactionConfigProvider);
      interaction.zoom(1, api);
      await delay();
      expect(api.endInteraction).toHaveBeenCalledTimes(1);
    });
  });
});

describe(TwistInteraction, () => {
  const api = new InteractionApiMock();

  const event1 = new MouseEvent('mousemove', { clientX: 10, clientY: 5 });
  const event2 = new MouseEvent('mousemove', { clientX: 15, clientY: 10 });
  const event3 = new MouseEvent('mousemove', { clientX: 25, clientY: 20 });

  const canvasPoint = Point.create(0, 0);

  const mockElement = {
    getBoundingClientRect() {
      return {
        left: 10,
        top: 10,
        width: 100,
        height: 100,
      };
    },
  } as unknown as HTMLElement;

  describe(TwistInteraction.prototype.beginDrag, () => {
    it('should start an interaction', () => {
      const interaction = new TwistInteraction();
      interaction.beginDrag(event1, canvasPoint, api, mockElement);

      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(TwistInteraction.prototype.drag, () => {
    it('should transform the camera for each drag event using bounding rect values', () => {
      const interaction = new TwistInteraction();
      interaction.beginDrag(event1, canvasPoint, api, mockElement);
      interaction.drag(event2, api);
      interaction.drag(event3, api);

      expect(api.twistCamera).toHaveBeenCalledTimes(2);
      expect(api.twistCamera).toHaveBeenCalledWith(Point.create(5, 0));
      expect(api.twistCamera).toHaveBeenCalledWith(Point.create(15, 10));
    });
  });

  describe(TwistInteraction.prototype.endDrag, () => {
    it('ends interaction if begin drag has been called', () => {
      const interaction = new TwistInteraction();
      interaction.beginDrag(event1, canvasPoint, api, mockElement);
      interaction.endDrag(event1, api);

      expect(api.endInteraction).toHaveBeenCalledTimes(1);
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new TwistInteraction();
      interaction.endDrag(event1, api);

      expect(api.endInteraction).not.toHaveBeenCalled();
    });
  });
});
