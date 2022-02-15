import { install } from 'resize-observer';

export default function (): void {
  if (typeof ResizeObserver === 'undefined') {
    install();
  }
}
