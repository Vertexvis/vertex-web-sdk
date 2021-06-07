// eslint-disable-next-line no-restricted-imports
import { readTask, writeTask } from '@stencil/core';

export function readDOM(task: () => void): void {
  readTask(task);
}

export function writeDOM(task: () => void): void {
  writeTask(task);
}
