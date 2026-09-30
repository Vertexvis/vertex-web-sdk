import './viewer-pin-label-line';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { Point } from '@vertexvis/geometry';

import { renderSource as render } from '#test/render-spec-page';

describe('vertex-ViewerPinLabelLine-pin', () => {
  it('should render a line between the given points', async () => {
    const start = Point.create(0, 0);
    const end = Point.create(100, 0);

    const page = await render(
      <vertex-viewer-pin-label-line pinPoint={start} labelPoint={end} />,
    );

    const el = page.root as HTMLVertexViewerPinLabelLineElement;

    const labelLine = el.querySelector('.label-line');
    expect(labelLine).toHaveClass('label-line');
    expect(labelLine).toEqualAttributes({
      x1: '100',
      x2: '0',
      y1: '0',
      y2: '0',
    });
  });
});
