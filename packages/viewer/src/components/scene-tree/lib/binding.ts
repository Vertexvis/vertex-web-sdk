const bindingRegEx = /{{(.+)}}/;

export interface Binding {
  bind<T>(data: T): void;
}

export class CollectionBinding implements Binding {
  public constructor(private bindings: Binding[]) {}

  public bind<T>(data: T): void {
    this.bindings.forEach((binding) => binding.bind(data));
  }
}

export abstract class NodeBinding<N extends Node> implements Binding {
  protected constructor(protected node: N, protected expr: string) {}

  public abstract bind<T>(data: T): void;
}

export class TextNodeBinding extends NodeBinding<Node> {
  public constructor(node: Node, expr: string) {
    super(node, expr);
  }

  public bind<T>(data: T): void {
    this.node.textContent = replaceBindingString(data, this.expr);
  }
}

export class AttributeBinding extends NodeBinding<Element> {
  public constructor(node: Element, expr: string, private attr: string) {
    super(node, expr);
  }

  public bind<T>(data: T): void {
    this.node.setAttribute(this.attr, replaceBindingString(data, this.expr));
  }
}

export class EventHandlerBinding extends NodeBinding<Element> {
  public constructor(node: Element, expr: string, private eventName: string) {
    super(node, expr);
  }

  public bind<T>(data: T): void {
    const path = extractBindingPath(this.expr);
    if (path != null) {
      const value = getBindableValue(data, path, true);
      (this.node as any)[this.eventName] = value;
    }
  }
}

export function generateBindings(element: Element): Binding[] {
  const bindings: Binding[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];

    if (child.nodeType === child.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const bindableAttributes = getBindableAttributes(el);

      bindableAttributes.forEach((attr) => {
        if (attr.name.startsWith('on')) {
          bindings.push(new EventHandlerBinding(el, attr.value, attr.name));
        } else {
          bindings.push(new AttributeBinding(el, attr.value, attr.name));
        }
      });
      bindings.push(...generateBindings(el));
    } else if (
      child.nodeType === child.TEXT_NODE &&
      child.textContent != null
    ) {
      bindings.push(new TextNodeBinding(child, child.textContent));
    }
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

function replaceBindingString(data: Record<string, any>, expr: string): string {
  const path = extractBindingPath(expr);
  if (path != null) {
    const value = getBindableValue(data, path, true);
    return expr.replace(`{{${path}}}`, value?.toString());
  } else {
    return expr;
  }
}

function getBindableValue(
  data: Record<string, any>,
  path: string,
  ignoreHead = false
): any {
  const [head, ...tail] = path.split('.');
  if (ignoreHead) {
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
