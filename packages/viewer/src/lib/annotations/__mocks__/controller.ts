import { EventDispatcher } from '@vertexvis/utils';

export class AnnotationController {
  public onStateChange = new EventDispatcher();

  public addAnnotationSet = vi.fn();
  public connect = vi.fn();
  public disconnect = vi.fn();
  public fetch = vi.fn();
  public removeAnnotationSet = vi.fn();

  public constructor(...args: unknown[]) {
    vi.fn()(...args);
  }
}
