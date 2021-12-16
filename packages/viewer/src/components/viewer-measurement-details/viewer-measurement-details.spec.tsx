// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Plane, Vector3 } from '@vertexvis/geometry';
import { ViewerMeasurementDetails } from './viewer-measurement-details';
import { MeasurementModel, summarizeResults } from '../../lib/measurement';
import { Angle } from '@vertexvis/geometry';

describe('vertex-viewer-measurement-details', () => {
  it('renders a details with measurement details', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => <vertex-viewer-measurement-details />,
    });

    const measurementDetails =
      page.root as HTMLVertexViewerMeasurementDetailsElement;

    expect(
      measurementDetails.shadowRoot?.querySelector(
        'div.measurement-details-entry'
      )
    ).toBeNull();

    measurementDetails.visibleSummary = summarizeResults([
      {
        type: 'minimum-distance',
        distance: 2,
        closestPoint1: Vector3.create(100, 200, 300),
        closestPoint2: Vector3.create(10, 20, 30),
      },
      {
        type: 'planar-distance',
        distance: 1,
        plane1: Plane.create(),
        plane2: Plane.create(),
      },
    ]);

    await page.waitForChanges();

    const entries = measurementDetails.shadowRoot?.querySelectorAll(
      'div.measurement-details-entry'
    ) as NodeListOf<HTMLDivElement>;

    expect(entries[0].innerText).toMatch('Parallel Dist:1.00 mm');
    expect(entries[1].innerText).toContain('Min Dist:2.00 mm');
  });

  it('formats distances', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => <vertex-viewer-measurement-details />,
    });

    const measurementDetails =
      page.root as HTMLVertexViewerMeasurementDetailsElement;

    measurementDetails.visibleSummary = {
      minDistance: 100,
    };

    await page.waitForChanges();

    measurementDetails.distanceUnits = 'centimeters';
    await page.waitForChanges();
    expect(
      measurementDetails.shadowRoot?.querySelector(
        'div.measurement-details-entry'
      )?.innerHTML
    ).toContain('10.00 cm');

    measurementDetails.distanceFormatter = () => 'formatted distance';
    await page.waitForChanges();
    expect(
      measurementDetails.shadowRoot?.querySelector(
        'div.measurement-details-entry'
      )?.innerHTML
    ).toContain('formatted distance');
  });

  it('formats angles', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => <vertex-viewer-measurement-details />,
    });

    const measurementDetails =
      page.root as HTMLVertexViewerMeasurementDetailsElement;

    const radians = Angle.toRadians(90);
    measurementDetails.visibleSummary = {
      angle: radians,
    };

    await page.waitForChanges();

    expect(
      measurementDetails.shadowRoot?.querySelector(
        'div.measurement-details-entry'
      )?.innerHTML
    ).toContain('90.00 deg');

    measurementDetails.angleUnits = 'radians';
    await page.waitForChanges();
    expect(
      measurementDetails.shadowRoot?.querySelector(
        'div.measurement-details-entry'
      )?.innerHTML
    ).toContain(`${radians.toFixed(2)} rad`);

    measurementDetails.angleFormatter = () => 'formatted angle';
    await page.waitForChanges();
    expect(
      measurementDetails.shadowRoot?.querySelector(
        'div.measurement-details-entry'
      )?.innerHTML
    ).toContain('formatted angle');
  });

  it('formats areas', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => <vertex-viewer-measurement-details />,
    });

    const measurementDetails =
      page.root as HTMLVertexViewerMeasurementDetailsElement;

    measurementDetails.visibleSummary = {
      area: 100,
    };

    await page.waitForChanges();

    measurementDetails.distanceUnits = 'centimeters';
    await page.waitForChanges();
    expect(
      measurementDetails.shadowRoot?.querySelector(
        'div.measurement-details-entry'
      )?.innerHTML
    ).toContain(
      '1.00 cm<span class="measurement-details-entry-label-superscript">2</span>'
    );

    measurementDetails.areaFormatter = () => 'formatted area';
    await page.waitForChanges();
    expect(
      measurementDetails.shadowRoot?.querySelector(
        'div.measurement-details-entry'
      )?.innerHTML
    ).toContain('formatted area');
  });

  it('responds to result changes', async () => {
    const model = new MeasurementModel();
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => (
        <vertex-viewer-measurement-details measurementModel={model} />
      ),
    });

    const measurementDetails =
      page.root as HTMLVertexViewerMeasurementDetailsElement;

    model.replaceResultsWithOutcome({
      results: [
        {
          type: 'minimum-distance',
          distance: 10,
          closestPoint1: Vector3.create(1, 5, 3),
          closestPoint2: Vector3.create(4, 2, 6),
        },
      ],
    });

    await page.waitForChanges();

    const entries = measurementDetails.shadowRoot?.querySelectorAll(
      'div.measurement-details-entry'
    ) as NodeListOf<HTMLDivElement>;

    expect(entries[0].innerText).toContain('Min Dist:10.00 mm');
    expect(entries[1].innerText).toContain('X:3.00 mm');
    expect(entries[2].innerText).toContain('Y:3.00 mm');
    expect(entries[3].innerText).toContain('Z:3.00 mm');
  });

  it('responds to model changes', async () => {
    const model = new MeasurementModel();
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => (
        <vertex-viewer-measurement-details measurementModel={model} />
      ),
    });

    const measurementDetails =
      page.root as HTMLVertexViewerMeasurementDetailsElement;

    model.replaceResultsWithOutcome({
      results: [
        {
          type: 'minimum-distance',
          distance: 10,
          closestPoint1: Vector3.create(1, 5, 3),
          closestPoint2: Vector3.create(4, 2, 6),
        },
      ],
    });

    await page.waitForChanges();

    const model2 = new MeasurementModel();
    measurementDetails.measurementModel = model2;

    await page.waitForChanges();

    model2.replaceResultsWithOutcome({
      results: [
        {
          type: 'planar-distance',
          distance: 10,
          plane1: Plane.create(),
          plane2: Plane.create(),
        },
      ],
    });

    await page.waitForChanges();

    const entries = measurementDetails.shadowRoot?.querySelectorAll(
      'div.measurement-details-entry'
    ) as NodeListOf<HTMLDivElement>;

    expect(entries.length).toBe(1);
    expect(entries[0].innerText).toContain('Parallel Dist:10.00 mm');
  });

  it('hides details', async () => {
    const model = new MeasurementModel();
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      template: () => (
        <vertex-viewer-measurement-details
          measurementModel={model}
          hiddenDetails={['distanceVector']}
        />
      ),
    });

    const measurementDetails =
      page.root as HTMLVertexViewerMeasurementDetailsElement;

    model.replaceResultsWithOutcome({
      results: [
        {
          type: 'minimum-distance',
          distance: 10,
          closestPoint1: Vector3.create(1, 5, 3),
          closestPoint2: Vector3.create(4, 2, 6),
        },
      ],
    });

    await page.waitForChanges();

    const entries = measurementDetails.shadowRoot?.querySelectorAll(
      'div.measurement-details-entry'
    ) as NodeListOf<HTMLDivElement>;

    expect(entries.length).toBe(1);
    expect(entries[0].innerText).toContain('Min Dist:10.00 mm');
  });

  it('hides details from json string', async () => {
    const model = new MeasurementModel();
    const page = await newSpecPage({
      components: [ViewerMeasurementDetails],
      html: `
        <vertex-viewer-measurement-details
          hidden-details='["minDistance"]'
        />`,
    });

    const measurementDetails =
      page.root as HTMLVertexViewerMeasurementDetailsElement;

    measurementDetails.measurementModel = model;

    await page.waitForChanges();

    model.replaceResultsWithOutcome({
      results: [
        {
          type: 'minimum-distance',
          distance: 10,
          closestPoint1: Vector3.create(1, 5, 3),
          closestPoint2: Vector3.create(4, 2, 6),
        },
      ],
    });

    await page.waitForChanges();

    const entries = measurementDetails.shadowRoot?.querySelectorAll(
      'div.measurement-details-entry'
    ) as NodeListOf<HTMLDivElement>;

    expect(entries.length).toBe(3);
    expect(entries[0].innerText).toContain('X:3.00 mm');
    expect(entries[1].innerText).toContain('Y:3.00 mm');
    expect(entries[2].innerText).toContain('Z:3.00 mm');
  });
});
