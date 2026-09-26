import { Point } from '@vertexvis/geometry';

import { DocumentApi, DocumentApiState } from '../lib/document/api';

export const mockPanByDelta = vi.fn();
export const mockZoomTo = vi.fn();
export const mockDispose = vi.fn();
export const mockLoad = vi.fn();
export const mockLoadPage = vi.fn();

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
