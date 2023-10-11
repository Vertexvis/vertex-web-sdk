// eslint-disable-next-line no-restricted-imports
import { EventEmitter, readTask, writeTask } from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

export interface EventEmitterDisposable<E>
  extends EventEmitter<E>,
    Disposable {}

export function readDOM(task: () => void): void {
  readTask(task);
}

export function writeDOM(task: () => void): void {
  writeTask(task);
}

export function debounceEvent<E>(
  event: EventEmitter<E>,
  wait: number
): EventEmitterDisposable<E> {
  let timer: number | undefined = undefined;
  function debounce(value: E): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => event.emit(value), wait);
  }
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit: debounce as any,
    dispose() {
      window.clearTimeout(timer);
    },
  };
}
