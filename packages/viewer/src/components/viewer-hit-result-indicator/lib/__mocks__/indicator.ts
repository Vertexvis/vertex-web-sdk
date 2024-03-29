const mockHitIndicatorConstructor = jest.fn();
const mockUpdateTransform = jest.fn();
const mockUpdateFrame = jest.fn();
const mockUpdateColors = jest.fn();
const mockUpdateOpacities = jest.fn();
const mockUpdateDimensions = jest.fn();
const mockUpdateAndDraw = jest.fn();

export class HitIndicator {
  public updateTransformAndNormal = mockUpdateTransform;
  public updateFrame = mockUpdateFrame;
  public updateColors = mockUpdateColors;
  public updateOpacities = mockUpdateOpacities;
  public updateDimensions = mockUpdateDimensions;
  public updateAndDraw = mockUpdateAndDraw;

  public constructor(...args: unknown[]) {
    mockHitIndicatorConstructor(...args);
  }
}
