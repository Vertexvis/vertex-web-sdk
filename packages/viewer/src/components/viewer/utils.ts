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

export function getAssignedSlotElements(slot: HTMLSlotElement): Element[] {
  if (typeof slot.assignedElements === 'function') {
    return slot.assignedElements({ flatten: true });
  } else {
    console.warn(
      'HTMLSlotElement.assignedElements() not found. Your browser may not support <slot> elements.'
    );
    return [];
  }
}

export function queryAllChildren(element: Element): Element[] {
  return Array.from(element.querySelectorAll('*'));
}
