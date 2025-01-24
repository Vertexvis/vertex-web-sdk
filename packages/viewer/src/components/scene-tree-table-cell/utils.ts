export function isSceneTreeTableCellElement(
  el: unknown
): el is HTMLVertexSceneTreeTableCellElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return el != null && (el as any).nodeName === 'VERTEX-SCENE-TREE-TABLE-CELL';
}

export function blurElement(element: HTMLElement): void {
  element.blur();
}
