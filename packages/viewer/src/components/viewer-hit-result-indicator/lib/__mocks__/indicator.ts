const mockHitIndicatorConstructor = vi.fn();
const mockUpdateTransform = vi.fn();
const mockUpdateFrame = vi.fn();
const mockUpdateColors = vi.fn();
const mockUpdateOpacities = vi.fn();
const mockUpdateDimensions = vi.fn();
const mockUpdateAndDraw = vi.fn();

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
