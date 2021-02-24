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

export function foo(): string {
  return 'hi';
}

export function getAssignedSlotNodes(slot: HTMLSlotElement): Node[] {
  if (typeof slot.assignedNodes === 'function') {
    return slot.assignedNodes({ flatten: true });
  } else {
    console.warn(
      'HTMLSlotElement.assignedNodes() not found. Your browser may not support <slot> elements.'
    );
    return [];
  }
}
