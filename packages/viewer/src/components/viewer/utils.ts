import { Color } from '@vertexvis/utils';

export function getElementBackgroundColor(
  element: HTMLElement
): Color.Color | undefined {
  const styles = window.getComputedStyle(element);
  return Color.fromCss(styles.backgroundColor);
}

export function getElementBoundingClientRect(element: HTMLElement): ClientRect {
  return element.getBoundingClientRect();
}
