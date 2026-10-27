import { type Mock, vi } from 'vitest';

const mockHitIndicatorConstructor = vi.fn();
const mockUpdateTransform = vi.fn();
const mockUpdateFrame = vi.fn();
const mockUpdateColors = vi.fn();
const mockUpdateOpacities = vi.fn();
const mockUpdateDimensions = vi.fn();
const mockUpdateAndDraw = vi.fn();

export class HitIndicator {
  public updateTransformAndNormal: Mock = mockUpdateTransform;
  public updateFrame: Mock = mockUpdateFrame;
  public updateColors: Mock = mockUpdateColors;
  public updateOpacities: Mock = mockUpdateOpacities;
  public updateDimensions: Mock = mockUpdateDimensions;
  public updateAndDraw: Mock = mockUpdateAndDraw;

  public constructor(...args: unknown[]) {
    mockHitIndicatorConstructor(...args);
  }
}
