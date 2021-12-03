import { append } from '../templates';

describe(append, () => {
  it('adds element and performs binding', () => {
    const container = document.createElement('div');
    const el = document.createElement('div');
    el.innerHTML = '<div id="id" attr:title="{{data.title}}"></div>';

    const data = { title: 'title' };
    const res = append(container, el, data);

    expect(res.element.querySelector('#id')?.getAttribute('title')).toBe(
      'title'
    );
  });
});
