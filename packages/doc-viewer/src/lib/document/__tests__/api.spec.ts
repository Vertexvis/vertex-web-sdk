import { Dimensions, Point } from '@vertexvis/geometry';

import { MockDocumentApi } from '../../../testing/mock-document-api';

describe('DocumentApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('zoomTo', () => {
    it('zooms to the specified percentage and maintains the same center point', async () => {
      const mockStateChanged = jest.fn();
      const api = new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0), viewport: Dimensions.create(100, 100) });

      api.onStateChanged(mockStateChanged);
      api.zoomTo(200);

      expect(mockStateChanged).toHaveBeenCalledWith(expect.objectContaining({ zoomPercentage: 200, panOffset: Point.create(-50, -50) }));
    });

    it('constrains the zoom percentage to the min and max values', async () => {
      const mockStateChanged = jest.fn();
      const api = new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0), viewport: Dimensions.create(100, 100) });

      api.onStateChanged(mockStateChanged);
      api.zoomTo(0);
      api.zoomTo(600);
    });

    it('constrains the pan offset to the original content viewport', async () => {
      const mockStateChanged = jest.fn();
      const api = new MockDocumentApi({
        zoomPercentage: 100,
        panOffset: Point.create(-100, -100),
        viewport: Dimensions.create(50, 50),
        contentDimensions: Dimensions.create(100, 100),
      });

      api.onStateChanged(mockStateChanged);
      await api.zoomTo(150);

      expect(mockStateChanged).toHaveBeenCalledWith(expect.objectContaining({ zoomPercentage: 150, panOffset: Point.create(-25, -25) }));
    });

    it('throws an error if the viewport is not defined', async () => {
      const api = new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0) });

      await expect(api.zoomTo(200)).rejects.toThrow('Viewport is not defined. Unable to perform zoom operation.');
    });
  });

  describe('panByDelta', () => {
    it('constrains the pan offset to the original content viewport', async () => {
      const mockStateChanged = jest.fn();
      const api = new MockDocumentApi({
        zoomPercentage: 150,
        panOffset: Point.create(0, 0),
        viewport: Dimensions.create(50, 50),
        contentDimensions: Dimensions.create(100, 100),
      });

      api.onStateChanged(mockStateChanged);
      await api.panByDelta(Point.create(-500, -500));

      expect(mockStateChanged).toHaveBeenCalledWith(expect.objectContaining({ panOffset: Point.create(-25, -25) }));
    });
  });
});
