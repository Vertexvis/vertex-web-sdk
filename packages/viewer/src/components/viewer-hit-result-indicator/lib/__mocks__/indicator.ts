const mockHitIndicatorConstructor = jest.fn();
const mockUpdateTransform = jest.fn();
const mockUpdateFrame = jest.fn();
const mockUpdateColors = jest.fn();
const mockUpdateOpacities = jest.fn();
const mockUpdateDimensions = jest.fn();

export class HitIndicator {
  public updateTransformAndNormal = mockUpdateTransform;
  public updateFrame = mockUpdateFrame;
  public updateColors = mockUpdateColors;
  public updateOpacities = mockUpdateOpacities;
  public updateDimensions = mockUpdateDimensions;

  public constructor(...args: unknown[]) {
    mockHitIndicatorConstructor(...args);
  }
}
