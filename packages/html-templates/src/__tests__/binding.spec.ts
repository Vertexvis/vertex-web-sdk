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
  it('adds event handler', () => {
    const node = document.createElement('div');

    const data = { func: jest.fn() };
    const binding = new EventHandlerBinding(node, '{{data.func}}', 'click');
    binding.bind(data);

    node.dispatchEvent(new MouseEvent('click'));
    expect(data.func).toHaveBeenCalled();
  });

  it('does nothing if binding expression invalid', () => {
    const node = document.createElement('div');

    const data = { func: jest.fn() };
    const binding = new EventHandlerBinding(node, '{{data.func', 'click');
    binding.bind(data);

    node.dispatchEvent(new MouseEvent('click'));
    expect(data.func).not.toHaveBeenCalled();
  });

  it('replaces existing listener', () => {
    const node = document.createElement('div');

    const data1 = { func: jest.fn() };
    const data2 = { func: jest.fn() };
    const binding = new EventHandlerBinding(node, '{{data.func}}', 'click');

    binding.bind(data1);
    binding.bind(data2);

    node.dispatchEvent(new MouseEvent('click'));
    expect(data1.func).not.toHaveBeenCalled();
    expect(data2.func).toHaveBeenCalled();
  });
});

describe(generateBindings, () => {
  it('returns parsed bindings', () => {
    const parent = document.createElement('div');
    parent.setAttribute('attr:title', '{{data.attr}}');

    const text = document.createElement('div');
    text.textContent = '{{data.text}}';
    parent.appendChild(text);

    const attr = document.createElement('div');
    attr.setAttribute('attr:title', '{{data.child.attr}}');
    parent.appendChild(attr);

    const event = document.createElement('div');
    event.innerHTML = '<div event:click="{{data.click}}"></div>';
    attr.appendChild(event);

    const eventCamelCase = document.createElement('div');
    eventCamelCase.innerHTML = '<div event:click-me="{{data.clickMe}}"></div>';
    attr.appendChild(eventCamelCase);

    const prop = document.createElement('div');
    prop.innerHTML = '<input prop:value="{{data.value}}"></input>';
    parent.appendChild(prop);

    const propCamelCase = document.createElement('div');
    propCamelCase.innerHTML =
      '<input prop:form-action="{{data.value}}"></input>';
    parent.appendChild(propCamelCase);

    const input1 = prop.firstElementChild as HTMLInputElement;
    const input2 = propCamelCase.firstElementChild as HTMLInputElement;

    const comment = document.createElement('div');
    comment.innerHTML = `<!-- <div/> -->`;
    parent.appendChild(comment);

    const data = {
      attr: 'attr',
      text: 'text',
      click: jest.fn(),
      clickMe: jest.fn(),
      child: { attr: 'attr-child' },
      value: 'foo',
    };
    const bindings = generateBindings(parent);
    const collection = new CollectionBinding(bindings);
    collection.bind(data);

    event.firstElementChild?.dispatchEvent(new MouseEvent('click'));
    eventCamelCase.firstElementChild?.dispatchEvent(new CustomEvent('clickMe'));

    expect(bindings).toHaveLength(7);
    expect(parent.getAttribute('title')).toBe('attr');
    expect(text.textContent).toBe('text');
    expect(attr.getAttribute('title')).toBe('attr-child');
    expect(data.click).toHaveBeenCalled();
    expect(data.clickMe).toHaveBeenCalled();
    expect(input1.value).toBe('foo');
    expect(input2.formAction).toBe('foo');
  });
});
