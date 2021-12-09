export type DomScrollToOptions = ScrollToOptions;

export function getSceneTreeTableOffsetTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top ?? 0;
}

export function getSceneTreeTableViewportWidth(el: HTMLElement): number {
  return el.clientWidth;
}

export function scrollToTop(
  el: HTMLElement,
  top: number,
  options: Pick<DomScrollToOptions, 'behavior'>
): void {
  el.scrollTo({ top, ...options });
}
