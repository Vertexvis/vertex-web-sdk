export function isSceneTreeRowElement(
  el: unknown
): el is HTMLVertexSceneTreeRowElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return el != null && (el as any).nodeName === 'VERTEX-SCENE-TREE-ROW';
}
