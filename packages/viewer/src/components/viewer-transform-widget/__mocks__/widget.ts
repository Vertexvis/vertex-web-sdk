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
  public getFullBounds = mockGetFullBounds;
  public boundsContainsPoint = mockBoundsContainsPoint;
  public onHoveredChanged = mockOnHoveredChanged;
  public updateTransform = mockUpdateTransform;
  public updateFrame = mockUpdateFrame;
  public updateCursor = mockUpdateCursor;
  public updateColors = mockUpdateColors;
  public updateScalars = mockUpdateScalars;
  public updateDimensions = mockUpdateDimensions;
  public updateDisabledAxis = mockUpdateDisabledAxis;
  public dispose = mockDispose;

  public constructor(...args: unknown[]) {
    mockTransformWidgetConstructor(...args);
  }
}
