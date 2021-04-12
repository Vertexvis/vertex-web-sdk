import { Disposable } from '../../utils/dist';
import { GestureResolver } from './resolver';

export abstract class GestureRecognizer {
  public addPointer(event: PointerEvent, resolver: GestureResolver): void {
    if (this.isPointerAllowed(event)) {
      this.addAllowedPointer(event, resolver);
    } else {
      this.handlePointerNotAllowed(event, resolver);
    }
  }

  public isPointerAllowed(event: PointerEvent): boolean {
    return event.type === 'pointerdown';
  }

  public gestureAccepted(): void {
    // no op
  }

  public gestureRejected(): void {
    // no op
  }

  protected createWindowEventHandler<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): Disposable {
    window.addEventListener(type, listener, options);
    return {
      dispose: () => window.removeEventListener(type, listener),
    };
  }

  protected handlePointerNotAllowed(
    event: PointerEvent,
    resolver: GestureResolver
  ): void {
    resolver.reject();
  }

  protected abstract addAllowedPointer(
    event: PointerEvent,
    resolver: GestureResolver
  ): void;
}
