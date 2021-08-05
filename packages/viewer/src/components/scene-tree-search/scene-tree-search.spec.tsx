// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Async } from '@vertexvis/utils';
import { SceneTreeSearch } from './scene-tree-search';

describe('vertex-scene-tree-search', () => {
  it('renders a text input', async () => {
    const page = await newSpecPage({
      components: [SceneTreeSearch],
      html: `
        <vertex-scene-tree-search
          placeholder="Placeholder"
          value="Text"
        ></vertex-scene-tree-search>`,
    });

    const input = page.root?.shadowRoot?.querySelector(
      '.input'
    ) as HTMLInputElement;

    expect(input).toEqualAttributes({
      placeholder: 'Placeholder',
      value: 'Text',
    });
  });

  it('makes elements disabled if search disabled', async () => {
    const page = await newSpecPage({
      components: [SceneTreeSearch],
      html: `<vertex-scene-tree-search value="text" disabled></vertex-scene-tree-search>`,
    });

    const input = page.root?.shadowRoot?.querySelector(
      '.input'
    ) as HTMLInputElement;
    const button = page.root?.shadowRoot?.querySelector(
      '.clear-btn'
    ) as HTMLButtonElement;

    expect(input).toHaveAttribute('disabled');
    expect(button).toHaveAttribute('disabled');
  });

  it('hides clear button when value has non-zero length', async () => {
    const page = await newSpecPage({
      components: [SceneTreeSearch],
      html: `<vertex-scene-tree-search></vertex-scene-tree-search>`,
    });

    const input = page.root?.shadowRoot?.querySelector(
      '.overlay-clear'
    ) as HTMLInputElement;

    expect(input).not.toHaveClass('show');
  });

  it('shows clear button when value has non-zero length', async () => {
    const page = await newSpecPage({
      components: [SceneTreeSearch],
      html: `<vertex-scene-tree-search value="text"></vertex-scene-tree-search>`,
    });

    const input = page.root?.shadowRoot?.querySelector(
      '.overlay-clear'
    ) as HTMLInputElement;

    expect(input).toHaveClass('show');
  });

  it('shows textfield background when input has focus', async () => {
    const page = await newSpecPage({
      components: [SceneTreeSearch],
      html: `<vertex-scene-tree-search></vertex-scene-tree-search>`,
    });

    const input = page.root?.shadowRoot?.querySelector(
      '.input'
    ) as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));

    await page.waitForChanges();

    expect(input).toHaveClass('background');
  });

  it('shows textfield background when value is non-empty', async () => {
    const page = await newSpecPage({
      components: [SceneTreeSearch],
      html: `<vertex-scene-tree-search value="text"></vertex-scene-tree-search>`,
    });

    const input = page.root?.shadowRoot?.querySelector(
      '.input'
    ) as HTMLInputElement;

    expect(input).toHaveClass('background');
  });

  it('shows blurred state when input blurs', async () => {
    const page = await newSpecPage({
      components: [SceneTreeSearch],
      html: `<vertex-scene-tree-search value="text"></vertex-scene-tree-search>`,
    });

    const input = page.root?.shadowRoot?.querySelector(
      '.input'
    ) as HTMLInputElement;

    input.dispatchEvent(new Event('focus'));
    await page.waitForChanges();

    input.dispatchEvent(new Event('blur'));
    await page.waitForChanges();

    expect(input).not.toHaveClass('focused');
  });

  it('clears value when clear button pressed', async () => {
    const page = await newSpecPage({
      components: [SceneTreeSearch],
      html: `<vertex-scene-tree-search value="text"></vertex-scene-tree-search>`,
    });

    const button = page.root?.shadowRoot?.querySelector(
      '.clear-btn'
    ) as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('mousedown'));

    expect(page.root?.value).toBe('');
  });

  it('debounces search events', async () => {
    const onSearch = jest.fn();

    const page = await newSpecPage({
      components: [SceneTreeSearch],
      template: () => (
        <vertex-scene-tree-search debounce={100} onSearch={onSearch} />
      ),
    });

    const input = page.root?.shadowRoot?.querySelector(
      '.input'
    ) as HTMLInputElement;
    input.value = 'text';
    input.dispatchEvent(new Event('input'));

    await Async.delay(50);
    expect(onSearch).not.toHaveBeenCalled();

    await Async.delay(100);
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'text',
      })
    );
  });

  it('emits search event when cleared', async () => {
    const onSearch = jest.fn();

    const page = await newSpecPage({
      components: [SceneTreeSearch],
      template: () => (
        <vertex-scene-tree-search debounce={0} onSearch={onSearch} />
      ),
    });

    const button = page.root?.shadowRoot?.querySelector(
      '.clear-btn'
    ) as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('mousedown'));

    await Async.delay(1);

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: '',
      })
    );
  });
});
