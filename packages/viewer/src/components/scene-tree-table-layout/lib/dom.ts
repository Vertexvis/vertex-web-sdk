export function getSceneTreeTableOffsetTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top ?? 0;
}

export function getSceneTreeTableViewportWidth(el: HTMLElement): number {
  return el.clientWidth;
}
