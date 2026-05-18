export function getElementBoundingClientRect(element: HTMLElement): ClientRect {
  return element.getBoundingClientRect();
}

export function getAllVertexElementChildren(element: Element): Element[] {
  return getAllChildren(element)
    .filter(node => node.nodeName.startsWith('VERTEX-'))
    .reduce((elements, element) => [...elements, element, ...getAllChildren(element)], [] as Element[]);
}

function getAllChildren(element: Element): Element[] {
  return Array.from(element.querySelectorAll('*'));
}
