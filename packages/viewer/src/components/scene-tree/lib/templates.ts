import { CollectionBinding, generateBindings } from './binding';
import { stampTemplate } from '../../../lib/templates';

export interface InstancedTemplate<E extends Element> {
  element: E;
  bindings: CollectionBinding;
}

export function append<E extends Element, D>(
  container: Element,
  element: E,
  data: D
): InstancedTemplate<E> {
  const bindings = new CollectionBinding(generateBindings(element));
  bindings.bind(data);
  container.appendChild(element);
  const created = container.lastElementChild as E;
  if (created != null) {
    return { element: created, bindings };
  } else {
    throw new Error('Failed to append element');
  }
}

export function generateInstanceFromTemplate(
  template: HTMLTemplateElement
): InstancedTemplate<HTMLElement> {
  const fragment = template.content.cloneNode(true) as HTMLElement;
  const element = stampTemplate<HTMLElement>(template);
  const bindings = new CollectionBinding(generateBindings(fragment));
  return { element, bindings };
}
