// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Vector3 } from '@vertexvis/geometry';

import { CalloutAnnotationData } from '../../lib/annotations/annotation';
import { ViewerAnnotationCallout } from './viewer-annotation-callout';

describe('viewer-annotation-callout', () => {
  const callout: CalloutAnnotationData = {
    type: 'callout',
    position: Vector3.create(),
    icon: 'close-circle',
    primaryColor: '#ffffff',
    accentColor: '#000000',
  };

  it('renders callout with border, fill and icon', async () => {
    const page = await newSpecPage({
      components: [ViewerAnnotationCallout],
      template: () => (
        <vertex-viewer-annotation-callout data={callout} iconSize="md" />
      ),
    });

    expect(page.root).toEqualHtml(`
      <vertex-viewer-annotation-callout>
        <mock:shadow-root>
          <div class="content md" style="border-color: #000000; background-color: #ffffff;">
            <vertex-viewer-icon class="icon" name="close-circle" size="md" style="color: #000000;"/>
          </div>
        </mock:shadow-root>
      </vertex-viewer-annotation-callout>
    `);
  });
});
