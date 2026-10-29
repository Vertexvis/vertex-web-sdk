import { Point } from '@vertexvis/geometry';
import { type Mock, vi } from 'vitest';

import { DocumentApi, DocumentApiState } from '../lib/document/api';

export const mockPanByDelta: Mock = vi.fn();
export const mockZoomTo: Mock = vi.fn();
export const mockDispose: Mock = vi.fn();
export const mockLoad: Mock = vi.fn();
export const mockLoadPage: Mock = vi.fn();

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
