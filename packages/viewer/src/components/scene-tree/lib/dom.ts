export function getSceneTreeViewportHeight(el: HTMLElement): number {
  return el.clientHeight;
}

export function getSceneTreeViewportWidth(el: HTMLElement): number {
  return el.clientWidth;
}

export function getSceneTreeOffsetTop(el: HTMLElement): number {
  return el.offsetTop;
}

export function getSceneTreeContainsElement(
  el: Element,
  other: Element
): boolean {
  return el.contains(other);
}

export function scrollToTop(
  el: HTMLElement,
  top: number,
  options: Pick<ScrollToOptions, 'behavior'>
): void {
  el.scrollTo({ top, ...options });
}
