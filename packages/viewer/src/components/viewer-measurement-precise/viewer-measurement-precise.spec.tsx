import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { PreciseMeasurementInteractionHandler } from '../../lib/measurement/interactions';
import { Viewer } from '../viewer/viewer';
import { ViewerMeasurementPrecise } from './viewer-measurement-precise';
import { MeasurementEntity, MeasurementModel } from '../..';
import { Vector3 } from '@vertexvis/geometry';

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

  it('renders elements for each entity', async () => {
    const model = new MeasurementModel();
    const page = await newSpecPage({
      components: [Viewer, ViewerMeasurementPrecise],
      template: () => (
        <vertex-viewer>
          <vertex-viewer-measurement-precise measurementModel={model} />
        </vertex-viewer>
      ),
    });

    const measurement = page.body.querySelector(
      'vertex-viewer-measurement-precise'
    );

    model.addEntity(new MeasurementEntity(Vector3.origin(), new Uint8Array()));
    model.addEntity(new MeasurementEntity(Vector3.origin(), new Uint8Array()));

    await page.waitForChanges();
    expect(
      measurement?.shadowRoot?.querySelectorAll('vertex-viewer-dom-element')
    ).toHaveLength(2);
  });
});
