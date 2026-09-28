import '../viewer/viewer';
import '../viewer-markup-arrow/viewer-markup-arrow';
import '../viewer-markup-circle/viewer-markup-circle';
import '../viewer-markup-freeform/viewer-markup-freeform';
import './viewer-markup-tool';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';
import { Vector3 } from '@vertexvis/geometry';

describe('vertex-viewer-markup-tool', () => {
  const start = Vector3.create(0, 0, 0);
  const end = Vector3.create(1, 1, 1);

  it('creates default arrow markup for editing', async () => {
    const page = await render(
      `<vertex-viewer-markup-tool></vertex-viewer-markup-tool>`,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const markupEl = page.root
      ?.firstElementChild as HTMLVertexViewerMarkupArrowElement;

    expect(markupEl.mode).toBe('create');
  });

  it('creates markup from arrow template if specified', async () => {
    const page = await render(
      `
        <template id="my-template">
          <vertex-viewer-markup-arrow class="my-markup"></vertex-viewer-markup-arrow>
        </template>
        <vertex-viewer-markup-tool arrow-template-id="my-template"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupArrowElement;

    expect(markupEl).toHaveClass('my-markup');
  });

  it('creates default markup if arrow template not found', async () => {
    const page = await render(
      `
        <template id="my-template">
          <vertex-viewer-markup-arrow class="my-markup"></vertex-viewer-markup-arrow>
        </template>
        <vertex-viewer-markup-tool arrow-template-id="not-my-template"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupArrowElement;

    expect(markupEl).not.toHaveClass('my-markup');
  });

  it('creates default markup if arrow template does not contain an arrow', async () => {
    const page = await render(
      `
        <template id="my-template">
          <div></div>
        </template>
        <vertex-viewer-markup-tool arrow-template-id="my-template"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupArrowElement;

    expect(markupEl).not.toHaveClass('my-markup');
  });

  it('creates default circle markup for editing', async () => {
    const page = await render(
      `<vertex-viewer-markup-tool tool="circle"></vertex-viewer-markup-tool>`,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const markupEl = page.root
      ?.firstElementChild as HTMLVertexViewerMarkupCircleElement;

    expect(markupEl.mode).toBe('create');
  });

  it('creates markup from circle template if specified', async () => {
    const page = await render(
      `
        <template id="my-template">
          <vertex-viewer-markup-circle class="my-markup"></vertex-viewer-markup-circle>
        </template>
        <vertex-viewer-markup-tool circle-template-id="my-template" tool="circle"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupCircleElement;

    expect(markupEl).toHaveClass('my-markup');
  });

  it('creates default markup if circle template not found', async () => {
    const page = await render(
      `
        <template id="my-template">
          <vertex-viewer-markup-circle class="my-markup"></vertex-viewer-markup-circle>
        </template>
        <vertex-viewer-markup-tool circle-template-id="not-my-template" tool="circle"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupCircleElement;

    expect(markupEl).not.toHaveClass('my-markup');
  });

  it('creates default markup if circle template does not contain a circle', async () => {
    const page = await render(
      `
        <template id="my-template">
          <div></div>
        </template>
        <vertex-viewer-markup-tool circle-template-id="my-template" tool="circle"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupCircleElement;

    expect(markupEl).not.toHaveClass('my-markup');
  });

  it('updates markup when circle template id changes', async () => {
    const page = await render(
      `
      <template id="my-template">
        <vertex-viewer-markup-circle class="my-markup"></vertex-viewer-markup-circle>
      </template>
      <vertex-viewer-markup-tool tool="circle"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector(
      'vertex-viewer-markup-tool',
    ) as HTMLVertexViewerMarkupToolElement;
    toolEl.circleTemplateId = 'my-template';
    await page.waitForChanges();

    const markupEl =
      toolEl.firstElementChild as HTMLVertexViewerMarkupCircleElement;

    expect(markupEl).toHaveClass('my-markup');
  });

  it('creates default freeform markup for editing', async () => {
    const page = await render(
      `<vertex-viewer-markup-tool tool="freeform"></vertex-viewer-markup-tool>`,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const markupEl = page.root
      ?.firstElementChild as HTMLVertexViewerMarkupFreeformElement;

    expect(markupEl.mode).toBe('create');
  });

  it('creates markup from freeform template if specified', async () => {
    const page = await render(
      `
        <template id="my-template">
          <vertex-viewer-markup-freeform class="my-markup"></vertex-viewer-markup-freeform>
        </template>
        <vertex-viewer-markup-tool freeform-template-id="my-template" tool="freeform"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupFreeformElement;

    expect(markupEl).toHaveClass('my-markup');
  });

  it('creates default markup if freeform template not found', async () => {
    const page = await render(
      `
        <template id="my-template">
          <vertex-viewer-markup-freeform class="my-markup"></vertex-viewer-markup-freeform>
        </template>
        <vertex-viewer-markup-tool freeform-template-id="not-my-template" tool="freeform"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupFreeformElement;

    expect(markupEl).not.toHaveClass('my-markup');
  });

  it('creates default markup if freeform template does not contain a freeform', async () => {
    const page = await render(
      `
        <template id="my-template">
          <div></div>
        </template>
        <vertex-viewer-markup-tool freeform-template-id="my-template" tool="freeform"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector('vertex-viewer-markup-tool');
    const markupEl =
      toolEl?.firstElementChild as HTMLVertexViewerMarkupFreeformElement;

    expect(markupEl).not.toHaveClass('my-markup');
  });

  it('updates markup when freeform template id changes', async () => {
    const page = await render(
      `
      <template id="my-template">
        <vertex-viewer-markup-freeform class="my-markup"></vertex-viewer-markup-freeform>
      </template>
      <vertex-viewer-markup-tool tool="freeform"></vertex-viewer-markup-tool>
      `,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector(
      'vertex-viewer-markup-tool',
    ) as HTMLVertexViewerMarkupToolElement;
    toolEl.freeformTemplateId = 'my-template';
    await page.waitForChanges();

    const markupEl =
      toolEl.firstElementChild as HTMLVertexViewerMarkupFreeformElement;

    expect(markupEl).toHaveClass('my-markup');
  });

  it('does not have markup if disabled', async () => {
    const page = await render(
      `<vertex-viewer-markup-tool disabled></vertex-viewer-markup-tool>`,
      { waitForReady: false },
    );
    await page.waitForChanges();

    expect(page.root?.firstElementChild).toBeNull();
  });

  it('removes markup when disabled', async () => {
    const page = await render(
      `<vertex-viewer-markup-tool></vertex-viewer-markup-tool>`,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = document.querySelector(
      'vertex-viewer-markup-tool',
    ) as HTMLVertexViewerMarkupToolElement;

    toolEl.disabled = true;
    await page.waitForChanges();

    expect(toolEl.children).toHaveLength(0);
  });

  it('updates markup when props change', async () => {
    const page = await render(
      <vertex-viewer>
        <vertex-viewer-markup-tool />
      </vertex-viewer>,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const viewer = page.root as HTMLVertexViewerElement;
    const toolEl = viewer.querySelector(
      'vertex-viewer-markup-tool',
    ) as HTMLVertexViewerMarkupToolElement;

    toolEl.viewer = viewer;
    await page.waitForChanges();
    const markupEl =
      toolEl.firstElementChild as HTMLVertexViewerMarkupArrowElement;
    expect(markupEl?.viewer).toBe(viewer);
  });

  it('emits markup event during editing', async () => {
    const onMarkupBegin = vi.fn();
    const onMarkupEnd = vi.fn();

    const page = await render(
      <vertex-viewer-markup-tool
        onMarkupBegin={onMarkupBegin}
        onMarkupEnd={onMarkupEnd}
      />,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const toolEl = page.root as HTMLVertexViewerMarkupToolElement;
    const markupEl =
      toolEl.firstElementChild as HTMLVertexViewerMarkupArrowElement;

    markupEl.dispatchEvent(new CustomEvent('interactionBegin'));
    expect(onMarkupBegin).toHaveBeenCalled();

    markupEl.start = start;
    markupEl.end = end;

    markupEl.dispatchEvent(new CustomEvent('interactionEnd'));
    expect(onMarkupEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          start,
          end,
          id: expect.stringContaining('markup'),
        }),
      }),
    );

    markupEl.start = undefined;
    markupEl.end = undefined;
  });
});
