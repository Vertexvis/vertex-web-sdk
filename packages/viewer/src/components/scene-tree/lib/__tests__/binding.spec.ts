import {
  AttributeBinding,
  Binding,
  CollectionBinding,
  EventHandlerBinding,
  generateBindings,
  TextNodeBinding,
} from '../binding';

class NoOpBinding implements Binding {
  public bind<T>(data: T): void {
    // noop
  }
}

describe(CollectionBinding, () => {
  it('calls bind on each child', () => {
    const binding = new NoOpBinding();
    const bind = jest.spyOn(binding, 'bind');

    const data = {};
    const collection = new CollectionBinding([binding]);
    collection.bind(data);
    expect(bind).toHaveBeenCalledWith(data);
  });
});

describe(TextNodeBinding, () => {
  it('replaces text content', () => {
    const node = document.createElement('div');
    node.textContent = '123 {{data.name}} 456';

    if (node.firstChild == null) {
      throw 'node is empty';
    }

    const binding = new TextNodeBinding(node.firstChild, node.textContent);

    const data1 = { name: 'foo' };
    const data2 = { name: 'bar' };

    binding.bind(data1);
    expect(node.textContent).toEqual('123 foo 456');

    binding.bind(data2);
    expect(node.textContent).toEqual('123 bar 456');
  });

  it('does nothing if expression is invalid', () => {
    const node = document.createElement('div');
    node.textContent = '123 {{data.name 456';

    if (node.firstChild == null) {
      throw 'node is empty';
    }

    const binding = new TextNodeBinding(node.firstChild, node.textContent);

    const data = { name: 'foo' };

    binding.bind(data);
    expect(node.textContent).toEqual('123 {{data.name 456');
  });

  it('does nothing if data is the same', () => {
    const node = document.createElement('div');
    node.textContent = '123 {{data.name}} 456';

    if (node.firstChild == null) {
      throw 'node is empty';
    }

    const binding = new TextNodeBinding(node.firstChild, node.textContent);

    const data = { name: 'foo' };

    binding.bind(data);
    binding.bind(data);
    expect(node.textContent).toEqual('123 foo 456');
  });
});

describe(AttributeBinding, () => {
  it('replaces attribute value', () => {
    const node = document.createElement('div');
    node.setAttribute('title', '123 {{data.name}} 456');

    const binding = new AttributeBinding(
      node,
      '123 {{data.name}} 456',
      'title'
    );

    const data1 = { name: 'foo' };
    const data2 = { name: 'bar' };

    binding.bind(data1);
    expect(node.getAttribute('title')).toEqual('123 foo 456');

    binding.bind(data2);
    expect(node.getAttribute('title')).toEqual('123 bar 456');
  });

  it('does nothing is data is the same', () => {
    const node = document.createElement('div');
    node.setAttribute('title', '123 {{data.name}} 456');

    const setAttribute = jest.spyOn(node, 'setAttribute');
    const binding = new AttributeBinding(
      node,
      '123 {{data.name}} 456',
      'title'
    );

    const data = { name: 'foo' };

    binding.bind(data);

    setAttribute.mockClear();
    binding.bind(data);
    expect(setAttribute).not.toHaveBeenCalled();
  });
});

describe(EventHandlerBinding, () => {
  it('replaces event handler', () => {
    const node = document.createElement('div');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).onclick = '{{data.func}}';

    const data = { func: jest.fn() };
    const binding = new EventHandlerBinding(node, '{{data.func}}', 'onclick');
    binding.bind(data);

    expect(node.onclick).toBe(data.func);
  });

  it('does nothing if binding expression invalid', () => {
    const node = document.createElement('div');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).onclick = '{{data.func';

    const data = { func: jest.fn() };
    const binding = new EventHandlerBinding(node, '{{data.func', 'onclick');

    binding.bind(data);

    expect(node.onclick).toBe('{{data.func');
  });

  it('does nothing if data is the same', () => {
    const node = document.createElement('div');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).onclick = '{{data.func}}';

    const data = { func: jest.fn() };
    const binding = new EventHandlerBinding(node, '{{data.func}}', 'onclick');

    binding.bind(data);
    binding.bind(data);

    expect(node.onclick).toBe(data.func);
  });
});

describe(generateBindings, () => {
  it('returns parsed bindings', () => {
    const parent = document.createElement('div');
    parent.setAttribute('title', '{{data.attr}}');

    const text = document.createElement('div');
    text.textContent = '{{data.text}}';
    parent.appendChild(text);

    const attr = document.createElement('div');
    attr.setAttribute('title', '{{data.child.attr}}');
    parent.appendChild(attr);

    const event = document.createElement('div');
    event.innerHTML = '<div onclick="{{data.event}}"></div>';
    attr.appendChild(event);

    const comment = document.createElement('div');
    comment.innerHTML = `<!-- <div/> -->`;
    parent.appendChild(comment);

    const data = {
      attr: 'attr',
      text: 'text',
      event: () => undefined,
      child: { attr: 'attr-child' },
    };
    const bindings = generateBindings(parent);
    const collection = new CollectionBinding(bindings);
    collection.bind(data);

    expect(bindings).toHaveLength(4);

    expect(parent.getAttribute('title')).toBe('attr');
    expect(text.textContent).toBe('text');
    expect(attr.getAttribute('title')).toBe('attr-child');
    expect(event.querySelector('div')?.onclick).toBe(data.event);
  });
});
