import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Vector3 } from '@vertexvis/geometry';
import { ViewerDistanceMeasurement } from '../viewer-distance-measurement/viewer-distance-measurement';
import { ViewerMeasurementTool } from './viewer-measurement-tool';

describe('vertex-viewer-measurement-tool', () => {
  const viewer = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  const start = Vector3.create(0, 0, 0);
  const end = Vector3.create(1, 1, 1);

  it('creates default measurement for editing', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool, ViewerDistanceMeasurement],
      html: `<vertex-viewer-measurement-tool></vertex-viewer-measurement-tool>`,
    });

    const measurementEl = page.root
      ?.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;

    expect(measurementEl.mode).toBe('replace');
  });

  it('creates measurement from template if specified', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool, ViewerDistanceMeasurement],
      html: `
        <template id="my-template">
          <vertex-viewer-distance-measurement class="my-measurement"></vertex-viewer-distance-measurement>
        </template>
        <vertex-viewer-measurement-tool distance-template-id="my-template"></vertex-viewer-measurement-tool>
      `,
    });

    const toolEl = page.body.querySelector('vertex-viewer-measurement-tool');
    const measurementEl = toolEl?.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;

    expect(measurementEl).toHaveClass('my-measurement');
  });

  it('creates default measurement if template not found', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool, ViewerDistanceMeasurement],
      html: `
        <template id="my-template">
          <vertex-viewer-distance-measurement class="my-measurement"></vertex-viewer-distance-measurement>
        </template>
        <vertex-viewer-measurement-tool distance-template-id="not-my-template"></vertex-viewer-measurement-tool>
      `,
    });

    const toolEl = page.body.querySelector('vertex-viewer-measurement-tool');
    const measurementEl = toolEl?.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;

    expect(measurementEl).not.toHaveClass('my-measurement');
  });

  it('creates default measurement if template does not contain measurement', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool, ViewerDistanceMeasurement],
      html: `
        <template id="my-template">
          <div></div>
        </template>
        <vertex-viewer-measurement-tool distance-template-id="my-template"></vertex-viewer-measurement-tool>
      `,
    });

    const toolEl = page.body.querySelector('vertex-viewer-measurement-tool');
    const measurementEl = toolEl?.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;

    expect(measurementEl).not.toHaveClass('my-measurement');
  });

  it('does not have measurement if disabled', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool],
      html: `<vertex-viewer-measurement-tool disabled></vertex-viewer-measurement-tool>`,
    });

    expect(page.root?.firstElementChild).toBeNull();
  });

  it('updates measurement when template id changes', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool, ViewerDistanceMeasurement],
      html: `
      <template id="my-template">
        <vertex-viewer-distance-measurement class="my-measurement"></vertex-viewer-distance-measurement>
      </template>
      <vertex-viewer-measurement-tool></vertex-viewer-measurement-tool>
      `,
    });

    const toolEl = page.body.querySelector(
      'vertex-viewer-measurement-tool'
    ) as HTMLVertexViewerMeasurementToolElement;
    toolEl.distanceTemplateId = 'my-template';
    await page.waitForChanges();

    const measurementEl = toolEl.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;

    expect(measurementEl.className).toBe('my-measurement');
  });

  it('removes measurement when disabled', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool, ViewerDistanceMeasurement],
      html: `<vertex-viewer-measurement-tool></vertex-viewer-measurement-tool>`,
    });

    const toolEl = page.body.querySelector(
      'vertex-viewer-measurement-tool'
    ) as HTMLVertexViewerMeasurementToolElement;

    toolEl.disabled = true;
    await page.waitForChanges();

    expect(toolEl.children).toHaveLength(0);
  });

  it('updates measurement when props change', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool, ViewerDistanceMeasurement],
      html: `<vertex-viewer-measurement-tool></vertex-viewer-measurement-tool>`,
    });

    const toolEl = page.root as HTMLVertexViewerMeasurementToolElement;
    let measurementEl: HTMLVertexViewerDistanceMeasurementElement | undefined;

    toolEl.units = 'inches';
    await page.waitForChanges();
    measurementEl = page.root
      ?.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;
    expect(measurementEl?.units).toBe(toolEl.units);

    toolEl.fractionalDigits = 0;
    await page.waitForChanges();
    measurementEl = page.root
      ?.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;
    expect(measurementEl?.fractionalDigits).toBe(toolEl.fractionalDigits);

    toolEl.snapDistance = 10;
    await page.waitForChanges();
    measurementEl = page.root
      ?.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;
    expect(measurementEl?.snapDistance).toBe(toolEl.snapDistance);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toolEl.viewer = viewer as any;
    await page.waitForChanges();
    measurementEl = page.root
      ?.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;
    expect(measurementEl?.viewer).toBe(viewer);
  });

  it('emits measurement event during editing', async () => {
    const onMeasureBegin = jest.fn();
    const onMeasureEnd = jest.fn();

    const page = await newSpecPage({
      components: [ViewerMeasurementTool, ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-measurement-tool
          onMeasureBegin={onMeasureBegin}
          onMeasureEnd={onMeasureEnd}
        />
      ),
    });

    const toolEl = page.root as HTMLVertexViewerMeasurementToolElement;
    const measurementEl = toolEl.firstElementChild as HTMLVertexViewerDistanceMeasurementElement;

    measurementEl.dispatchEvent(new CustomEvent('editBegin'));
    expect(onMeasureBegin).toHaveBeenCalled();
    expect(toolEl.isMeasuring).toBe(true);

    measurementEl.start = start;
    measurementEl.end = end;

    measurementEl.dispatchEvent(new CustomEvent('editEnd'));
    expect(onMeasureEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          start,
          end,
          invalid: false,
          id: expect.stringContaining('measurement'),
        }),
      })
    );
    expect(toolEl.isMeasuring).toBe(false);

    measurementEl.start = undefined;
    measurementEl.end = undefined;
  });
});
