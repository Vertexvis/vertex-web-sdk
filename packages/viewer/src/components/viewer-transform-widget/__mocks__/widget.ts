const mockTransformWidgetConstructor = jest.fn();
const mockBoundsContainsPoint = jest.fn();
const mockOnHoveredChanged = jest.fn();
const mockUpdatePosition = jest.fn();
const mockUpdateFrame = jest.fn();
const mockUpdateCursor = jest.fn();
const mockUpdateColors = jest.fn();
const mockUpdateDimensions = jest.fn();

export class TransformWidget {
  public boundsContainsPoint = mockBoundsContainsPoint;
  public onHoveredChanged = mockOnHoveredChanged;
  public updatePosition = mockUpdatePosition;
  public updateFrame = mockUpdateFrame;
  public updateCursor = mockUpdateCursor;
  public updateColors = mockUpdateColors;
  public updateDimensions = mockUpdateDimensions;

  public constructor(...args: unknown[]) {
    mockTransformWidgetConstructor(...args);
  }
}
