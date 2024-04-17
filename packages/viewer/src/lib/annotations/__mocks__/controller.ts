import { EventDispatcher } from '@vertexvis/utils';

export class AnnotationController {
  public onStateChange = new EventDispatcher();

  public addAnnotationSet = jest.fn();
  public connect = jest.fn();
  public disconnect = jest.fn();
  public fetch = jest.fn();
  public removeAnnotationSet = jest.fn();

  public constructor(...args: unknown[]) {
    jest.fn()(...args);
  }
}
