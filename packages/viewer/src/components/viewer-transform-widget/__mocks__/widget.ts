const mockTransformWidgetConstructor = jest.fn();
const mockOnHoveredChanged = jest.fn();
const mockUpdatePosition = jest.fn();
const mockUpdateFrame = jest.fn();

export class TransformWidget {
  public onHoveredChanged = mockOnHoveredChanged;
  public updatePosition = mockUpdatePosition;
  public updateFrame = mockUpdateFrame;

  public constructor(...args: unknown[]) {
    mockTransformWidgetConstructor(...args);
  }
}
