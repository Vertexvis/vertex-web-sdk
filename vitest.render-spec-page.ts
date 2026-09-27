import { render, type RenderResult } from '@stencil/vitest';
import { vi } from 'vitest';

/** Bridge for existing component fixtures while they move to Vitest's render API. */
export interface RenderSpecPageOptions {
  components?: unknown[];
  html?: string;
  template?: () => unknown;
}

export interface RenderSpecPage extends RenderResult<HTMLElement> {
  rootInstance: any;
  body: HTMLElement;
  doc: Document;
}

export async function renderSpecPage(
  options: RenderSpecPageOptions,
): Promise<RenderSpecPage> {
  const template = options.template?.() ?? options.html;
  if (template == null) {
    throw new Error(
      'A template or html string is required to render a spec page',
    );
  }
  // Source component imports register custom elements through stencilVitestPlugin.
  // The source transform does not resolve componentOnReady(), so wait for Stencil's
  // update cycle explicitly after rendering.
  const result = await render(template, { waitForReady: false });
  // render() reports the first top-level element. Legacy specs commonly place
  // one or more <template> fixtures before the component under test.
  let root = result.root;
  while (root.tagName === 'TEMPLATE' && root.nextElementSibling) {
    root = root.nextElementSibling as HTMLElement;
  }
  const waitForChanges = async (): Promise<void> => {
    const pending = (
      result.waitForChanges as (node: HTMLElement) => Promise<void>
    )(root);
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(32);
    await pending;
  };
  await waitForChanges();
  // The source transform adds a hydration marker that newSpecPage did not add.
  // Remove it from fixture DOM so existing class and HTML assertions keep their
  // meaning; this does not alter the compiled component output.
  const clearHydrationClasses = (node: Element | ShadowRoot): void => {
    for (const child of Array.from(node.children)) {
      if (child.tagName.includes('-')) {
        child.removeAttribute('hydrated');
        const names = (child.getAttribute('class') || '')
          .split(/\s+/)
          .filter(
            (name) => name && name !== 'hydrated' && !name.startsWith('sc-'),
          );
        if (names.length) child.setAttribute('class', names.join(' '));
        else child.removeAttribute('class');
      }
      if (child.shadowRoot) clearHydrationClasses(child.shadowRoot);
      clearHydrationClasses(child);
    }
  };
  if (root.tagName.includes('-')) {
    root.removeAttribute('hydrated');
    const names = (root.getAttribute('class') || '')
      .split(/\s+/)
      .filter((name) => name && name !== 'hydrated' && !name.startsWith('sc-'));
    if (names.length) root.setAttribute('class', names.join(' '));
    else root.removeAttribute('class');
  }
  if (root.shadowRoot) clearHydrationClasses(root.shadowRoot);
  clearHydrationClasses(root);
  return {
    ...result,
    root,
    waitForChanges: async () => {
      await waitForChanges();
      if (root.shadowRoot) clearHydrationClasses(root.shadowRoot);
      clearHydrationClasses(root);
    },
    rootInstance: root,
    body: document.body,
    doc: document,
  };
}
