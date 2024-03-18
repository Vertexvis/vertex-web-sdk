const mockTransformWidgetConstructor = jest.fn();
const mockGetFullBounds = jest.fn();
const mockBoundsContainsPoint = jest.fn();
const mockOnHoveredChanged = jest.fn();
const mockUpdateTransform = jest.fn();
const mockUpdateFrame = jest.fn();
const mockUpdateCursor = jest.fn();
const mockUpdateColors = jest.fn();
const mockUpdateDimensions = jest.fn();
const mockUpdateDisabledAxis = jest.fn();

export class TransformWidget {
  public getFullBounds = mockGetFullBounds;
  public boundsContainsPoint = mockBoundsContainsPoint;
  public onHoveredChanged = mockOnHoveredChanged;
  public updateTransform = mockUpdateTransform;
  public updateFrame = mockUpdateFrame;
  public updateCursor = mockUpdateCursor;
  public updateColors = mockUpdateColors;
  public updateDimensions = mockUpdateDimensions;
  public updateDisabledAxis = mockUpdateDisabledAxis;

  public constructor(...args: unknown[]) {
    mockTransformWidgetConstructor(...args);
  }
}
