export function isVertexViewerDomGroup(
  el: unknown
): el is HTMLVertexViewerDomGroupElement {
  return el instanceof HTMLElement && el.nodeName === 'VERTEX-VIEWER-DOM-GROUP';
}