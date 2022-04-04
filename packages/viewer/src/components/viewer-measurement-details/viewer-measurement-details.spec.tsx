// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { Plane, Vector3 } from '@vertexvis/geometry';
import { Angle } from '@vertexvis/geometry';

import { MeasurementModel } from '../../lib/measurement';
import { ViewerMeasurementDetails } from './viewer-measurement-details';

describe('vertex-viewer-measurement-details', () => {
  it('renders a details with measurement details', async () => {
    const { model, page } = await newMeasurementDetailsSpec();
    const comp = page.root as HTMLVertexViewerMeasurementDetailsElement;

    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')
    ).toBeNull();

    model.setOutcome({
      isApproximate: false,
      results: [
        {
          type: 'minimum-distance',
          distance: 2,
          point1: Vector3.create(100, 200, 300),
          point2: Vector3.create(10, 20, 30),
        },
        {
          type: 'planar-distance',
          distance: 1,
          plane1: Plane.create(),
          plane2: Plane.create(),
        },
      ],
    });

    await page.waitForChanges();

    const entries = comp.shadowRoot?.querySelectorAll(
      'div.measurement-details-entry'
    ) as NodeListOf<HTMLDivElement>;

    expect(entries[0].innerText).toMatch('Parallel Dist:1.00 mm');
    expect(entries[1].innerText).toContain('Dist:2.00 mm');
  });

  it('displays minimum distance', async () => {
    const { model, page } = await newMeasurementDetailsSpec();
    const comp = page.root as HTMLVertexViewerMeasurementDetailsElement;

    model.setOutcome({
      isApproximate: true,
      results: [
        {
          type: 'minimum-distance',
          point1: Vector3.create(0, 0, 0),
          point2: Vector3.create(0, 0, 100),
          distance: 100,
        },
      ],
    });

    await page.waitForChanges();
    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')?.innerHTML
    ).toContain('~100.00 mm');

    comp.distanceUnits = 'centimeters';
    await page.waitForChanges();
    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')?.innerHTML
    ).toContain('~10.00 cm');

    comp.distanceFormatter = () => 'formatted distance';
    await page.waitForChanges();
    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')?.innerHTML
    ).toContain('formatted distance');
  });

  it('displays planar angle', async () => {
    const angle = Angle.toRadians(90);
    const { model, page } = await newMeasurementDetailsSpec();
    const comp = page.root as HTMLVertexViewerMeasurementDetailsElement;

    model.setOutcome({
      isApproximate: false,
      results: [
        {
          type: 'planar-angle',
          angle: angle,
          plane1: Plane.create(),
          plane2: Plane.create(),
        },
      ],
    });

    await page.waitForChanges();

    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')?.innerHTML
    ).toContain('90.00 deg');

    comp.angleUnits = 'radians';
    await page.waitForChanges();
    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')?.innerHTML
    ).toContain(`${angle.toFixed(2)} rad`);

    comp.angleFormatter = () => 'formatted angle';
    await page.waitForChanges();
    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')?.innerHTML
    ).toContain('formatted angle');
  });

  it('displays area', async () => {
    const { model, page } = await newMeasurementDetailsSpec();
    const comp = page.root as HTMLVertexViewerMeasurementDetailsElement;

    model.setOutcome({
      isApproximate: false,
      results: [{ type: 'surface-area', area: 100 }],
    });

    await page.waitForChanges();

    comp.distanceUnits = 'centimeters';
    await page.waitForChanges();
    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')?.innerHTML
    ).toContain('1.00 cm²');

    comp.areaFormatter = () => 'formatted area';
    await page.waitForChanges();
    expect(
      comp.shadowRoot?.querySelector('div.measurement-details-entry')?.innerHTML
    ).toContain('formatted area');
  });

  it('responds to model changes', async () => {
    const { model, page } = await newMeasurementDetailsSpec();
    const comp = page.root as HTMLVertexViewerMeasurementDetailsElement;

    model.setOutcome({
      isApproximate: false,
      results: [
        {
          type: 'minimum-distance',
          distance: 10,
          point1: Vector3.create(1, 5, 3),
          point2: Vector3.create(4, 2, 6),
        },
      ],
    });

    await page.waitForChanges();

    const model2 = new MeasurementModel();
    model2.setOutcome({
      isApproximate: false,
      results: [
        {
          type: 'planar-distance',
          distance: 10,
          plane1: Plane.create(),
          plane2: Plane.create(),
        },
      ],
    });

    comp.measurementModel = model2;
    await page.waitForChanges();

    const entries = comp.shadowRoot?.querySelectorAll(
      'div.measurement-details-entry'
    ) as NodeListOf<HTMLDivElement>;

    expect(entries.length).toBe(1);
    expect(entries[0].innerText).toContain('Parallel Dist:10.00 mm');
  });

  it('hides results', async () => {
    const model = new MeasurementModel();
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => (
        <vertex-viewer-measurement-details
          measurementModel={model}
          resultTypes={['minimum-distance']}
        />
      ),
    });

    const comp = page.root as HTMLVertexViewerMeasurementDetailsElement;

    model.setOutcome({
      isApproximate: false,
      results: [
        {
          type: 'minimum-distance',
          distance: 10,
          point1: Vector3.create(1, 5, 3),
          point2: Vector3.create(4, 2, 6),
        },
      ],
    });

    await page.waitForChanges();
    const entries = comp.shadowRoot?.querySelectorAll(
      'div.measurement-details-entry'
    ) as NodeListOf<HTMLDivElement>;
    expect(entries[0].innerText).toContain('Dist:10.00 mm');

    comp.resultTypes = ['planar-angle'];
    await page.waitForChanges();
    expect(
      comp.shadowRoot?.querySelectorAll('div.measurement-details-entry')
    ).toHaveLength(0);
  });

  async function newMeasurementDetailsSpec(): Promise<{
    page: SpecPage;
    model: MeasurementModel;
  }> {
    const model = new MeasurementModel();
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => (
        <vertex-viewer-measurement-details measurementModel={model} />
      ),
    });

    return { page, model };
  }
});
