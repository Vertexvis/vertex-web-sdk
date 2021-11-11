export function getSceneTreeTableOffsetTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top ?? 0;
}
