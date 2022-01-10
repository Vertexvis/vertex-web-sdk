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
    const strokeLineEl = el.shadowRoot
      ?.querySelector('.line-stroke')
      ?.querySelector('.line');
    const fillLineEl = el.shadowRoot
      ?.querySelector('.line-stroke')
      ?.querySelector('.line');

    expect(strokeLineEl).toEqualHtml(`
      <line class="line" x1="0" x2="100" y1="0" y2="0" />
    `);
    expect(fillLineEl).toEqualHtml(`
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
    const strokeStartCap = el.shadowRoot
      ?.querySelector('.line-stroke')
      ?.querySelector('.start-cap') as SVGLineElement;
    const strokeEndCap = el.shadowRoot
      ?.querySelector('.line-stroke')
      ?.querySelector('.end-cap') as SVGLineElement;
    const fillStartCap = el.shadowRoot
      ?.querySelector('.line-fill')
      ?.querySelector('.start-cap') as SVGLineElement;
    const fillEndCap = el.shadowRoot
      ?.querySelector('.line-fill')
      ?.querySelector('.end-cap') as SVGLineElement;

    expect(parseFloat(fillStartCap.getAttribute('x1') ?? '')).toBeCloseTo(0);
    expect(parseFloat(fillStartCap.getAttribute('y1') ?? '')).toBeCloseTo(5);
    expect(parseFloat(fillStartCap.getAttribute('x2') ?? '')).toBeCloseTo(0);
    expect(parseFloat(fillStartCap.getAttribute('y2') ?? '')).toBeCloseTo(-5);

    expect(parseFloat(fillEndCap.getAttribute('x1') ?? '')).toBeCloseTo(100);
    expect(parseFloat(fillEndCap.getAttribute('y1') ?? '')).toBeCloseTo(5);
    expect(parseFloat(fillEndCap.getAttribute('x2') ?? '')).toBeCloseTo(100);
    expect(parseFloat(fillEndCap.getAttribute('y2') ?? '')).toBeCloseTo(-5);

    expect(parseFloat(strokeStartCap.getAttribute('x1') ?? '')).toBeCloseTo(0);
    expect(parseFloat(strokeStartCap.getAttribute('y1') ?? '')).toBeCloseTo(
      5.5
    );
    expect(parseFloat(strokeStartCap.getAttribute('x2') ?? '')).toBeCloseTo(0);
    expect(parseFloat(strokeStartCap.getAttribute('y2') ?? '')).toBeCloseTo(
      -5.5
    );

    expect(parseFloat(strokeEndCap.getAttribute('x1') ?? '')).toBeCloseTo(100);
    expect(parseFloat(strokeEndCap.getAttribute('y1') ?? '')).toBeCloseTo(5.5);
    expect(parseFloat(strokeEndCap.getAttribute('x2') ?? '')).toBeCloseTo(100);
    expect(parseFloat(strokeEndCap.getAttribute('y2') ?? '')).toBeCloseTo(-5.5);
  });
});
