import { Disposable } from './disposable';

export type Listener<T> = (event: T) => void;

export class EventDispatcher<T> {
  private listeners: Listener<T>[] = [];

  public on(listener: Listener<T>): Disposable {
    this.listeners.push(listener);
    return { dispose: () => this.off(listener) };
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
