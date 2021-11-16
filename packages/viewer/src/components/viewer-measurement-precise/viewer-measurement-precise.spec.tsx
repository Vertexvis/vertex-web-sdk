import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { PreciseMeasurementInteractionHandler } from '../../lib/measurement/interactions';
import { Viewer } from '../viewer/viewer';
import { ViewerMeasurementPrecise } from './viewer-measurement-precise';

describe('vertex-viewer-measurement-precise', () => {
  it('registers interaction handler', async () => {
    const page = await newSpecPage({
      components: [Viewer, ViewerMeasurementPrecise],
      html: `
      <vertex-viewer>
        <vertex-viewer-measurement-precise></vertex-viewer-measurement-precise>
      </vertex-viewer>`,
    });

    const viewer = page.body.querySelector('vertex-viewer');
    const handlers = await viewer?.getInteractionHandlers();

    expect(handlers).toEqual(
      expect.arrayContaining([expect.any(PreciseMeasurementInteractionHandler)])
    );
  });

  it('registers and deregisters interaction handler when component added or removed', async () => {
    const page = await newSpecPage({
      components: [Viewer, ViewerMeasurementPrecise],
      html: `
      <vertex-viewer>
        <vertex-viewer-measurement-precise></vertex-viewer-measurement-precise>
      </vertex-viewer>`,
    });

    const measurement = page.body.querySelector(
      'vertex-viewer-measurement-precise'
    ) as HTMLVertexViewerMeasurementPreciseElement;
    const viewer = page.body.querySelector('vertex-viewer');

    measurement.remove();
    let handlers = await viewer?.getInteractionHandlers();
    expect(handlers).not.toEqual(
      expect.arrayContaining([expect.any(PreciseMeasurementInteractionHandler)])
    );

    viewer?.appendChild(measurement);
    handlers = await viewer?.getInteractionHandlers();
    expect(handlers).toEqual(
      expect.arrayContaining([expect.any(PreciseMeasurementInteractionHandler)])
    );
  });
});
