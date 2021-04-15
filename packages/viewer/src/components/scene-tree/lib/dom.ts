export function getSceneTreeViewportHeight(el: HTMLElement): number {
  return el.clientHeight;
}

export function getSceneTreeOffsetTop(el: HTMLElement): number {
  return el.offsetTop;
}

export function getSceneTreeContainsElement(
  el: HTMLElement,
  other: HTMLElement
): boolean {
  return el.contains(other);
}
