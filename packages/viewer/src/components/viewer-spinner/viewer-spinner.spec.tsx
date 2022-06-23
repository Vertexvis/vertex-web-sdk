import { newSpecPage } from '@stencil/core/testing';

import { ViewerSpinner } from './viewer-spinner';

describe('viewer spinner', () => {
  it('renders a xs spinner', async () => {
    const page = await newSpecPage({
      components: [ViewerSpinner],
      html: `<vertex-viewer-spinner size="xs"></vertex-viewer-spinner>`,
    });

    const spinner = page.root?.shadowRoot?.querySelector('.xs');
    expect(spinner?.innerHTML).toContain('div');
  });

  it('renders a sm spinner', async () => {
    const page = await newSpecPage({
      components: [ViewerSpinner],
      html: `<vertex-viewer-spinner size="sm"></vertex-viewer-spinner>`,
    });

    const spinner = page.root?.shadowRoot?.querySelector('.sm');
    expect(spinner?.innerHTML).toContain('div');
  });

  it('renders a md spinner', async () => {
    const page = await newSpecPage({
      components: [ViewerSpinner],
      html: `<vertex-viewer-spinner size="md"></vertex-viewer-spinner>`,
    });

    const spinner = page.root?.shadowRoot?.querySelector('.md');
    expect(spinner?.innerHTML).toContain('div');
  });

  it('renders a lg spinner', async () => {
    const page = await newSpecPage({
      components: [ViewerSpinner],
      html: `<vertex-viewer-spinner size="lg"></vertex-viewer-spinner>`,
    });

    const spinner = page.root?.shadowRoot?.querySelector('.lg');
    expect(spinner?.innerHTML).toContain('div');
  });
});
