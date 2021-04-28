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

  public bind<T>(data: T): void {
    const value = replaceBinding(data, this.expr);
    const existingValue = (this.node as any)[this.attr];
    if (existingValue !== value) {
      // console.log('update binding', value);
      (this.node as any)[this.attr] = value;
    }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (value !== (this.node as any)[this.eventName]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.node as any)[this.eventName] = value;
      }
    }
  }
}

export function generateBindings(node: Node): Binding[] {
  const bindings: Binding[] = [];

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const bindableAttributes = getBindableAttributes(el);

    bindableAttributes.forEach((attr) => {
      if (attr.name.startsWith('on')) {
        bindings.push(new EventHandlerBinding(el, attr.value, attr.name));
      } else {
        bindings.push(new AttributeBinding(el, attr.value, attr.name));
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replaceBindingString(data: Record<string, any>, expr: string): string {
  const path = extractBindingPath(expr);
  if (path != null) {
    const value = getBindableValue(data, path, true);
    return expr.replace(`{{${path}}}`, value?.toString());
  } else {
    return expr;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replaceBinding(data: Record<string, any>, expr: string): any {
  const path = extractBindingPath(expr);
  if (path != null) {
    const value = getBindableValue(data, path, true);
    return value;
  } else {
    return expr;
  }
}

function getBindableValue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
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
