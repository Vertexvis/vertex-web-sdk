import { EventDispatcher } from '@vertexvis/utils';
import { type Mock, vi } from 'vitest';

export class AnnotationController {
  public onStateChange = new EventDispatcher();

  public addAnnotationSet: Mock = vi.fn();
  public connect: Mock = vi.fn();
  public disconnect: Mock = vi.fn();
  public fetch: Mock = vi.fn();
  public removeAnnotationSet: Mock = vi.fn();

  public constructor(...args: unknown[]) {
    vi.fn()(...args);
  }
}
