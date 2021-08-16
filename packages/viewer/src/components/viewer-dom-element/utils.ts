export function isVertexViewerDomElement(
  el: unknown
): el is HTMLVertexViewerDomElementElement {
  return (
    el instanceof HTMLElement && el.nodeName === 'VERTEX-VIEWER-DOM-ELEMENT'
  );
}
