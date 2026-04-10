import { Point } from '@vertexvis/geometry';

import { mockGetDocument, mockGetPage, MockOptionalContentConfig } from '../../../../__mocks__/pdfjs-mock';
import { PdfJsApi } from '../../../pdf/pdfjs-api';
import { DocumentApi } from '../../api';
import { DocumentLayersController } from '..';

class MockApiWithoutLayers extends DocumentApi {
  public dispose = jest.fn();
  public load = jest.fn();
  public loadPage = jest.fn();

  public constructor() {
    super({
      zoomPercentage: 100,
      panOffset: Point.create(0, 0),
    });
  }
}

describe('DocumentLayersController', () => {
  describe('enabled', () => {
    it('returns true if the API supports layers', () => {
      const mockApi = new PdfJsApi();
      const controller = new DocumentLayersController(mockApi);

      expect(controller.enabled).toBe(true);
    });

    it('returns false if the API does not support layers', () => {
      const mockApi = new MockApiWithoutLayers();
      const controller = new DocumentLayersController(mockApi);

      expect(controller.enabled).toBe(false);
    });
  });

  describe('getLayers', () => {
    it('returns the layers of the document', async () => {
      const mockApi = new PdfJsApi();
      const mockLayerIds = new Array(10).fill(undefined).map((_, index) => `layer-${index}`);
      const mockOptionalContentConfig = new MockOptionalContentConfig();
      const mockPdfDocument = {
        numPages: 1,
        getPage: mockGetPage,
        getOptionalContentConfig: jest.fn(() => Promise.resolve(mockOptionalContentConfig)),
      };

      mockLayerIds.forEach(layerId => {
        mockOptionalContentConfig.set(layerId, { name: layerId, visible: true });
      });
      mockGetDocument.mockReturnValueOnce({ promise: Promise.resolve(mockPdfDocument) });

      await mockApi.load('https');

      const controller = new DocumentLayersController(mockApi);

      expect(await controller.getLayers()).toEqual(mockLayerIds.map(layerId => ({ id: layerId, name: layerId, visible: true })));
    });

    it('throws an error if the API does not support layers', async () => {
      const mockApi = new MockApiWithoutLayers();
      const controller = new DocumentLayersController(mockApi);

      await expect(controller.getLayers()).rejects.toThrow('The current document does not support layers.');
    });
  });

  describe('setLayerVisibility', () => {
    it('sets the visibility of a layer', async () => {
      const mockApi = new PdfJsApi();
      const mockLayerId = 'layer-1';
      const mockOptionalContentConfig = new MockOptionalContentConfig();
      const mockPdfDocument = {
        numPages: 1,
        getPage: mockGetPage,
        getOptionalContentConfig: jest.fn(() => Promise.resolve(mockOptionalContentConfig)),
      };

      mockOptionalContentConfig.set(mockLayerId, { name: mockLayerId, visible: true });
      mockGetDocument.mockReturnValueOnce({ promise: Promise.resolve(mockPdfDocument) });

      await mockApi.load('https');

      const controller = new DocumentLayersController(mockApi);
      await controller.setLayerVisibility(mockLayerId, false);

      expect(mockOptionalContentConfig.setVisibility).toHaveBeenCalledWith(mockLayerId, false);
    });

    it('throws an error if the API does not support layers', async () => {
      const mockApi = new MockApiWithoutLayers();
      const controller = new DocumentLayersController(mockApi);

      await expect(controller.setLayerVisibility('layer-1', false)).rejects.toThrow('The current document does not support layers.');
    });
  });
});
