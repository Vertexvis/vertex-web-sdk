import '../viewer-icon/viewer-icon';
import './viewer-annotation-callout';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { Vector3 } from '@vertexvis/geometry';

import { renderSource as render } from '#test/render-spec-page';

import { CalloutAnnotationData } from '../../lib/annotations/annotation';

describe('viewer-annotation-callout', () => {
  const callout: CalloutAnnotationData = {
    type: 'callout',
    position: Vector3.create(),
    icon: 'close-circle',
    primaryColor: '#ffffff',
    accentColor: '#000000',
  };

  it('renders callout with border, fill and icon', async () => {
    const page = await render(
      <vertex-viewer-annotation-callout data={callout} iconSize="md" />,
    );

    const content = page.root.shadowRoot?.querySelector('.content');
    const icon = content?.querySelector('vertex-viewer-icon');
    expect(content).toHaveClasses(['md', 'content']);
    expect((content as HTMLElement).style.borderColor).toBe('#000000');
    expect((content as HTMLElement).style.backgroundColor).toBe('#ffffff');
    expect(icon).toHaveClass('icon');
    expect(icon?.style.color).toBe('#000000');
    expect(icon?.shadowRoot?.querySelector('svg')).not.toBeNull();
  });
});
