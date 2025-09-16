import { Disposable } from '@vertexvis/utils';
import { camelCase } from 'camel-case';

const bindingRegEx = /{{(.+)}}/;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BindingDataMap = Record<string, any>;

export interface Binding {
  bind<T extends BindingDataMap>(data: T): void;
}

export class CollectionBinding implements Binding {
  public constructor(private bindings: Binding[]) {}

  public bind<T extends BindingDataMap>(data: T): void {
    this.bindings.forEach((binding) => binding.bind(data));
  }
}

export abstract class NodeBinding<N extends Node> implements Binding {
  protected constructor(protected node: N, protected expr: string) {}

  public abstract bind<T extends BindingDataMap>(data: T): void;
}

export class TextNodeBinding extends NodeBinding<Node> {
  public constructor(node: Node, expr: string) {
    super(node, expr);
  }

  public bind<T extends BindingDataMap>(data: T): void {
    const newContent = replaceBindingString(data, this.expr);
    if (newContent !== this.node.textContent) {
      this.node.textContent = newContent;
    }
  }
}

export class AttributeBinding extends NodeBinding<Element> {
  public constructor(node: Element, expr: string, private attr: string) {
    super(node, expr);
  }

  public bind<T extends BindingDataMap>(data: T): void {
    const newValue = replaceBindingString(data, this.expr);
    const oldValue = this.node.getAttribute(this.attr);
    if (oldValue !== newValue) {
      this.node.setAttribute(this.attr, newValue);
    }
  }
}

export class PropertyBinding extends NodeBinding<Element> {
  public constructor(node: Element, expr: string, private prop: string) {
    super(node, expr);
  }

  public bind<T extends BindingDataMap>(data: T): void {
    const newValue = replaceBinding(data, this.expr);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const oldValue = (this.node as any)[this.prop];
    if (oldValue !== newValue) {
      (this.node as any)[this.prop] = newValue;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}

export class EventHandlerBinding extends NodeBinding<Element> {
  private disposable?: Disposable;

  public constructor(node: Element, expr: string, private eventName: string) {
    super(node, expr);
  }

  public bind<T extends BindingDataMap>(data: T): void {
    const path = extractBindingPath(this.expr);
    if (path != null) {
      this.disposable?.dispose();

      const listener = getBindableValue(data, path, true);
      this.node.addEventListener(this.eventName, listener);

      this.disposable = {
        dispose: () => {
          this.node.removeEventListener(this.eventName, listener);
        },
      };
    }
  }
}

export function generateBindings(node: Node): Binding[] {
  const bindings: Binding[] = [];

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const bindableAttributes = getBindableAttributes(el);

    bindableAttributes.forEach((attr) => {
      if (attr.name.startsWith('event:')) {
        const eventName = camelCase(attr.name.replace('event:', ''));
        bindings.push(new EventHandlerBinding(el, attr.value, eventName));
      } else if (attr.name.startsWith('attr:')) {
        bindings.push(
          new AttributeBinding(el, attr.value, attr.name.replace('attr:', ''))
        );
      } else if (attr.name.startsWith('prop:')) {
        const propName = camelCase(attr.name.replace('prop:', ''));
        bindings.push(new PropertyBinding(el, attr.value, propName));
      }
    });
  } else if (
    node.nodeType === Node.TEXT_NODE &&
    node.textContent != null &&
    bindingRegEx.test(node.textContent)
  ) {
    bindings.push(new TextNodeBinding(node, node.textContent));
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    bindings.push(...generateBindings(node.childNodes[i]));
  }

  return bindings;
}

function getBindableAttributes(element: Element): Attr[] {
  return Array.from(element.attributes).filter((attr) =>
    bindingRegEx.test(attr.value)
  );
}

function extractBindingPath(expr: string): string | undefined {
  const result = bindingRegEx.exec(expr);
  return result != null ? result[1] : undefined;
}

function replaceBindingString(data: BindingDataMap, expr: string): string {
  const path = extractBindingPath(expr);
  if (path != null) {
    const value = getBindableValue(data, path, true);
    return expr.replace(`{{${path}}}`, value?.toString());
  } else {
    return expr;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replaceBinding(data: BindingDataMap, expr: string): any {
  const path = extractBindingPath(expr);
  if (path != null) {
    const value = getBindableValue(data, path, true);
    return value;
  } else {
    return expr;
  }
}

function getBindableValue(
  data: BindingDataMap,
  path: string,
  isHead = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const [head, ...tail] = path.split('.');
  if (isHead && tail.length === 0) {
    return data;
  } else if (isHead && tail.length > 0) {
    return getBindableValue(data, tail.join('.'), false);
  } else {
    const value = data[head];
    if (tail.length > 0) {
      return getBindableValue(value, tail.join('.'), false);
    } else {
      return value;
    }
  }
}
