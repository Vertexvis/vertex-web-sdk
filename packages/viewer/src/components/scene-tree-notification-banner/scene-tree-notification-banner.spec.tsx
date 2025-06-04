import { newSpecPage, SpecPage } from '@stencil/core/testing';

import { SceneTreeNotificationBanner } from './scene-tree-notification-banner';

describe('<vertex-scene-tree-notification-banner>', () => {
  it('renders a message', async () => {
    const message = 'My Message';
    const { banner } = await newComponentSpec({
      html: `<vertex-scene-tree-notification-banner message="${message}"></vertex-scene-tree-notification-banner>`,
    });

    expect(banner.shadowRoot?.querySelector('div')).not.toBeNull();
    expect(banner.shadowRoot?.querySelector('p')?.textContent).toBe(message);
  });

  it('emits an action event when the action button is clicked', async () => {
    const onActionMock = jest.fn();
    const { banner } = await newComponentSpec({
      html: `<vertex-scene-tree-notification-banner action-label="My Action"></vertex-scene-tree-notification-banner>`,
    });

    banner.addEventListener('action', onActionMock);
    const actionButton = banner.shadowRoot?.querySelector(
      '.notification-banner-button'
    );
    actionButton?.dispatchEvent(new MouseEvent('click'));

    expect(onActionMock).toHaveBeenCalled();
  });

  it('does not render an action button if no action label is provided', async () => {
    const { banner } = await newComponentSpec({
      html: `<vertex-scene-tree-notification-banner></vertex-scene-tree-notification-banner>`,
    });

    expect(
      banner.shadowRoot?.querySelector('.notification-banner-button')
    ).toBeNull();
  });
});

async function newComponentSpec(data: { html: string }): Promise<{
  page: SpecPage;
  banner: HTMLVertexSceneTreeNotificationBannerElement;
}> {
  const page = await newSpecPage({
    components: [SceneTreeNotificationBanner],
    html: data.html,
  });
  const banner = page.root as HTMLVertexSceneTreeNotificationBannerElement;

  return { page, banner };
}
