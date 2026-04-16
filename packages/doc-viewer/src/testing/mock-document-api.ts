import { Point } from '@vertexvis/geometry';

import { DocumentApi, DocumentApiState } from '../lib/document/api';

export const mockPanByDelta = jest.fn();
export const mockZoomTo = jest.fn();
export const mockDispose = jest.fn();
export const mockLoad = jest.fn();
export const mockLoadPage = jest.fn();

export class MockDocumentApi extends DocumentApi {
  public panByDelta = mockPanByDelta.mockImplementation((delta: Point.Point) => super.panByDelta(delta));
  public zoomTo = mockZoomTo.mockImplementation((percentage: number) => super.zoomTo(percentage));
  public dispose = mockDispose;
  public load = mockLoad;
  public loadPage = mockLoadPage;

  public constructor(initialState: DocumentApiState) {
    super(initialState);
  }
}
