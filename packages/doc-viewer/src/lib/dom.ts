export function getElementBoundingClientRect(element: HTMLElement): ClientRect {
  return element.getBoundingClientRect();
}

export function createElement<T extends HTMLElement>(tagName: string): T {
  return document.createElement(tagName) as T;
}

export function getAllVertexElementChildren(element: Element): Element[] {
  return getAllChildren(element)
    .filter(node => node.nodeName.startsWith('VERTEX-'))
    .reduce((elements, element) => [...elements, element, ...getAllChildren(element)], [] as Element[]);
}

function getAllChildren(element: Element): Element[] {
  return Array.from(element.querySelectorAll('*'));
}
