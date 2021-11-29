import { Disposable } from './disposable';
import { Predicate } from './predicate';

export type Listener<T> = (event: T) => void;

interface OnOptions {
  abort?: AbortSignal;
}

export class EventDispatcher<T> {
  private listeners: Listener<T>[] = [];

  public on(listener: Listener<T>, opts: OnOptions = {}): Disposable {
    this.listeners.push(listener);

    const controller = new AbortController();
    controller.signal.addEventListener('abort', () => this.off(listener));
    opts.abort?.addEventListener('abort', () => controller.abort());

    return { dispose: () => controller.abort() };
  }

  public once(opts: OnOptions = {}): Promise<T> {
    return new Promise((resolve) => {
      this.on((event) => resolve(event), opts);
    });
  }

  public async onceWhen(
    predicate: Predicate<T>,
    opts: OnOptions = {}
  ): Promise<T> {
    const controller = new AbortController();
    opts.abort?.addEventListener('abort', () => controller.abort());

    return new Promise((resolve) => {
      this.when(
        predicate,
        (event) => {
          if (predicate(event)) {
            controller.abort();
            resolve(event);
          }
        },
        { ...opts, abort: controller.signal }
      );
    });
  }

  public when(
    predicate: Predicate<T>,
    listener: Listener<T>,
    opts: OnOptions = {}
  ): Disposable {
    return this.on((event) => {
      if (predicate(event)) {
        listener(event);
      }
    }, opts);
  }

  public off(listener: Listener<T>): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  public emit(event: T): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
