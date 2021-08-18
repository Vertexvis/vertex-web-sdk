jest.mock('../interactionApi');

import {
  RotateInteraction,
  PanInteraction,
  ZoomInteraction,
  TwistInteraction,
} from '../mouseInteractions';
import { InteractionApi } from '../interactionApi';
import { Point, Ray } from '@vertexvis/geometry';

const InteractionApiMock = InteractionApi as jest.Mock<InteractionApi>;

beforeEach(() => {
  jest.resetAllMocks();
  jest.clearAllMocks();
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

  const event1 = new MouseEvent('mousemove', { screenX: 10, screenY: 5 });
  const event2 = new MouseEvent('mousemove', { screenX: 15, screenY: 10 });
  const event3 = new MouseEvent('mousemove', { screenX: 25, screenY: 20 });

  const canvasPoint = Point.create(0, 0);

  describe(PanInteraction.prototype.beginDrag, () => {
    it('begins interaction once for multiple begin drag calls', () => {
      const interaction = new PanInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.beginDrag(event1, canvasPoint, api);

      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(PanInteraction.prototype.drag, () => {
    it('first drag rotates camera using delta between begin drag and drag', () => {
      const interaction = new PanInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.drag(event2, api);

      expect(api.panCamera).toHaveBeenCalledWith(Point.create(5, 5));
    });

    it('continuous drags rotate camera using delta between calls', () => {
      const interaction = new PanInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.drag(event2, api);
      interaction.drag(event3, api);

      expect(api.panCamera).toHaveBeenNthCalledWith(2, Point.create(10, 10));
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new PanInteraction();
      interaction.drag(event1, api);

      expect(api.panCamera).not.toHaveBeenCalled();
    });
  });

  describe(PanInteraction.prototype.endDrag, () => {
    it('ends interaction if begin drag has been called', () => {
      const interaction = new PanInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
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
  const api = new (InteractionApi as jest.Mock<InteractionApi>)();
  api.transformCamera;

  const event1 = new MouseEvent('mousemove', { screenX: 10, screenY: 5 });
  const event2 = new MouseEvent('mousemove', { screenX: 15, screenY: 10 });
  const event3 = new MouseEvent('mousemove', { screenX: 25, screenY: 20 });

  const canvasPoint = Point.create(0, 0);

  describe(ZoomInteraction.prototype.beginDrag, () => {
    it('begins interaction once for multiple begin drag calls', () => {
      const interaction = new ZoomInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.beginDrag(event1, canvasPoint, api);

      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(ZoomInteraction.prototype.drag, () => {
    it('first drag rotates camera using delta between begin drag and drag', () => {
      const interaction = new ZoomInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.drag(event2, api);

      expect(api.zoomCamera).toHaveBeenCalledWith(5, undefined);
    });

    it('continuous drags rotate camera using delta between calls', () => {
      const interaction = new ZoomInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.drag(event2, api);
      interaction.drag(event3, api);

      expect(api.zoomCamera).toHaveBeenNthCalledWith(2, 10, undefined);
    });

    it.only('uses the starting point ray', () => {
      const div = document.createElement('div');
      jest
        .spyOn(div, 'getBoundingClientRect')
        .mockReturnValue({ left: 0, top: 0 } as DOMRect);
      jest.spyOn(api, 'getRayFromPoint').mockReturnValue(Ray.create());
      const interaction = new ZoomInteraction();
      interaction.beginDrag(event1, canvasPoint, api, div);
      interaction.drag(event2, api);
      interaction.drag(event3, api);

      expect(api.zoomCamera).toBeCalledWith(5, Ray.create());
      expect(api.zoomCamera).toBeCalledWith(10, Ray.create());
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new ZoomInteraction();
      interaction.drag(event1, api);

      expect(api.zoomCamera).not.toHaveBeenCalled();
    });
  });

  describe(ZoomInteraction.prototype.endDrag, () => {
    it('ends interaction if begin drag has been called', () => {
      const interaction = new ZoomInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.endDrag(event1, api);

      expect(api.endInteraction).toHaveBeenCalledTimes(1);
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new ZoomInteraction();
      interaction.endDrag(event1, api);

      expect(api.endInteraction).not.toHaveBeenCalled();
    });
  });

  describe(ZoomInteraction.prototype.zoom, () => {
    const timeoutDelay = 50;

    function delay(): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, timeoutDelay + 10));
    }

    it('only begins interaction once within interaction timeout', async () => {
      const interaction = new ZoomInteraction(timeoutDelay);
      interaction.zoom(1, api);
      interaction.zoom(1, api);

      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
      await delay();
    });

    it('ends interaction after interaction timeout', async () => {
      const interaction = new ZoomInteraction(timeoutDelay);
      interaction.zoom(1, api);
      await delay();
      expect(api.endInteraction).toHaveBeenCalledTimes(1);
    });
  });
});

describe(TwistInteraction, () => {
  const api = new InteractionApiMock();

  const event1 = new MouseEvent('mousemove', { screenX: 10, screenY: 5 });
  const event2 = new MouseEvent('mousemove', { screenX: 15, screenY: 10 });
  const event3 = new MouseEvent('mousemove', { screenX: 25, screenY: 20 });

  const canvasPoint = Point.create(0, 0);

  describe(TwistInteraction.prototype.beginDrag, () => {
    it('should start an interaction', () => {
      const interaction = new TwistInteraction();
      interaction.beginDrag(event1, canvasPoint, api);

      expect(api.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(TwistInteraction.prototype.drag, () => {
    it('should transform the camera for each drag event', () => {
      const interaction = new TwistInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
      interaction.drag(event2, api);
      interaction.drag(event3, api);

      expect(api.twistCamera).toHaveBeenCalledTimes(2);
    });

    it('does nothing if begin drag has not been called', () => {
      const interaction = new ZoomInteraction();
      interaction.drag(event1, api);

      expect(api.zoomCamera).not.toHaveBeenCalled();
    });
  });

  describe(TwistInteraction.prototype.endDrag, () => {
    it('ends interaction if begin drag has been called', () => {
      const interaction = new TwistInteraction();
      interaction.beginDrag(event1, canvasPoint, api);
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
