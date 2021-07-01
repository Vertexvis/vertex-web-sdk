// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Point } from '@vertexvis/geometry';
import { ViewerMeasurementLine } from './viewer-measurement-line';

describe('vertex-viewer-measurement-line', () => {
  const start = Point.create(0, 0);
  const end = Point.create(100, 0);

  it('renders a line between start and end', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementLine],
      template: () => (
        <vertex-viewer-measurement-line start={start} end={end} />
      ),
    });

    const el = page.root as HTMLVertexViewerMeasurementLineElement;

    expect(el.shadowRoot?.querySelector('.line')).toEqualHtml(`
      <line class="line" x1="0" x2="100" y1="0" y2="0" />
    `);
  });

  it('renders line caps', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementLine],
      template: () => (
        <vertex-viewer-measurement-line
          start={start}
          end={end}
          capLength={10}
        />
      ),
    });

    const el = page.root as HTMLVertexViewerMeasurementLineElement;

    const startCap = el.shadowRoot?.querySelector(
      '.start-cap'
    ) as SVGLineElement;
    expect(parseFloat(startCap.getAttribute('x1') ?? '')).toBeCloseTo(0);
    expect(parseFloat(startCap.getAttribute('y1') ?? '')).toBeCloseTo(5);
    expect(parseFloat(startCap.getAttribute('x2') ?? '')).toBeCloseTo(0);
    expect(parseFloat(startCap.getAttribute('y2') ?? '')).toBeCloseTo(-5);

    const endCap = el.shadowRoot?.querySelector('.end-cap') as SVGLineElement;
    expect(parseFloat(endCap.getAttribute('x1') ?? '')).toBeCloseTo(100);
    expect(parseFloat(endCap.getAttribute('y1') ?? '')).toBeCloseTo(5);
    expect(parseFloat(endCap.getAttribute('x2') ?? '')).toBeCloseTo(100);
    expect(parseFloat(endCap.getAttribute('y2') ?? '')).toBeCloseTo(-5);
  });
});
