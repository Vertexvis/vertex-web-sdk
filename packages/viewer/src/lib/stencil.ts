// eslint-disable-next-line no-restricted-imports
import { EventEmitter, readTask, writeTask } from '@stencil/core';

export function readDOM(task: () => void): void {
  readTask(task);
}

export function writeDOM(task: () => void): void {
  writeTask(task);
}

export function debounceEvent<E>(
  event: EventEmitter<E>,
  wait: number
): EventEmitter<E> {
  let timer: number | undefined = undefined;
  function debounce(value: E): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => event.emit(value), wait);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { emit: debounce as any };
}
