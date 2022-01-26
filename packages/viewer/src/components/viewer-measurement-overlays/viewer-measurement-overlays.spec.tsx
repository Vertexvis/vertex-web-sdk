// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { Vector3 } from '@vertexvis/geometry';

import {
  MeasurementOverlayManager,
  MinimumDistanceMeasurementResult,
} from '../../lib/measurement';
import { ViewerMeasurementOverlays } from './viewer-measurement-overlays';

describe('vertex-viewer-measurement-overlays', () => {
  const minDistance: MinimumDistanceMeasurementResult = {
    type: 'minimum-distance',
    point1: Vector3.right(),
    point2: Vector3.left(),
    distance: 2,
  };

  it('renders a distance vector overlay', async () => {
    const overlays = new MeasurementOverlayManager();
    overlays.addDistanceVectorFromResult(minDistance);

    const { page } = await newOverlaysSpec({ overlays });
    const comp = page.root as HTMLVertexViewerMeasurementOverlaysElement;

    await page.waitForChanges();
    expect(comp.shadowRoot?.querySelector('.distance-vector-x')).toBeDefined();
    expect(comp.shadowRoot?.querySelector('.distance-vector-y')).toBeDefined();
    expect(comp.shadowRoot?.querySelector('.distance-vector-z')).toBeDefined();
  });

  it('renders a line overlay', async () => {
    const overlays = new MeasurementOverlayManager();
    overlays.addLineFromResult(minDistance);

    const { page } = await newOverlaysSpec({ overlays });
    const comp = page.root as HTMLVertexViewerMeasurementOverlaysElement;

    await page.waitForChanges();
    expect(comp.shadowRoot?.querySelector('.measurement-line')).toBeDefined();
  });

  it('rerenders overlays when overlays change', async () => {
    const { page, overlays } = await newOverlaysSpec();
    const comp = page.root as HTMLVertexViewerMeasurementOverlaysElement;

    overlays.addLineFromResult(minDistance);

    await page.waitForChanges();
    expect(comp.shadowRoot?.querySelector('.measurement-line')).toBeDefined();
  });

  async function newOverlaysSpec({
    overlays = new MeasurementOverlayManager(),
  }: {
    overlays?: MeasurementOverlayManager;
  } = {}): Promise<{
    page: SpecPage;
    overlays: MeasurementOverlayManager;
  }> {
    const page = await newSpecPage({
      components: [ViewerMeasurementOverlays],
      template: () => (
        <vertex-viewer-measurement-overlays measurementOverlays={overlays} />
      ),
    });

    return { page, overlays };
  }
});
