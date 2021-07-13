export function isSceneTreeRowElement(
  el: unknown
): el is HTMLVertexSceneTreeRowElement {
  return el instanceof HTMLElement && el.nodeName === 'VERTEX-SCENE-TREE-ROW';
}
