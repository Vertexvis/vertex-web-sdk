import { type Mock, vi } from 'vitest';

const mockTransformWidgetConstructor = vi.fn();
const mockGetFullBounds = vi.fn();
const mockBoundsContainsPoint = vi.fn();
const mockOnHoveredChanged = vi.fn();
const mockUpdateTransform = vi.fn();
const mockUpdateFrame = vi.fn();
const mockUpdateCursor = vi.fn();
const mockUpdateColors = vi.fn();
const mockUpdateScalars = vi.fn();
const mockUpdateDimensions = vi.fn();
const mockUpdateDisabledAxis = vi.fn();
const mockDispose = vi.fn();

export class TransformWidget {
  public getFullBounds: Mock = mockGetFullBounds;
  public boundsContainsPoint: Mock = mockBoundsContainsPoint;
  public onHoveredChanged: Mock = mockOnHoveredChanged;
  public updateTransform: Mock = mockUpdateTransform;
  public updateFrame: Mock = mockUpdateFrame;
  public updateCursor: Mock = mockUpdateCursor;
  public updateColors: Mock = mockUpdateColors;
  public updateScalars: Mock = mockUpdateScalars;
  public updateDimensions: Mock = mockUpdateDimensions;
  public updateDisabledAxis: Mock = mockUpdateDisabledAxis;
  public dispose: Mock = mockDispose;

  public constructor(...args: unknown[]) {
    mockTransformWidgetConstructor(...args);
  }
}
