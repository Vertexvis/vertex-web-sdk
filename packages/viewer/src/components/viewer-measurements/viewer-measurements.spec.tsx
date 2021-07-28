import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Vector3 } from '@vertexvis/geometry';
import { DistanceMeasurement } from '../../lib/types';
import { ViewerDistanceMeasurement } from '../viewer-distance-measurement/viewer-distance-measurement';
import { ViewerMeasurements } from './viewer-measurements';

describe('vertex-viewer-measurements', () => {
  const viewer = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  const measurement1 = new DistanceMeasurement({
    start: Vector3.create(0, 0, 0),
    end: Vector3.create(1, 1, 1),
    id: `measurement-1`,
  });

  const measurement2 = new DistanceMeasurement({
    start: Vector3.create(1, 1, 1),
    end: Vector3.create(2, 2, 2),
    id: `measurement-2`,
  });

  describe('adding measurements', () => {
    it('adds a measurement element with default distance measurement', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `<vertex-viewer-measurements units="inches" fractional-digits="1" snap-distance="10"></vertex-viewer-measurements>`,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const measurementEl = await el.addMeasurement(measurement1);

      expect(el.children).toHaveLength(1);
      expect(measurementEl.id).toBe(measurement1.id);
      expect(measurementEl.start).toBe(measurement1.start);
      expect(measurementEl.end).toBe(measurement1.end);
      expect(measurementEl.invalid).toBe(measurement1.invalid);
      expect(measurementEl.units).toBe('inches');
      expect(measurementEl.fractionalDigits).toBe(1);
      expect(measurementEl.snapDistance).toBe(10);
    });

    it('adds a measurement element with distance template', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `
          <template id="my-template">
            <vertex-viewer-distance-measurement class="my-class"></vertex-viewer-distance-measurement>
          </template>
          <vertex-viewer-measurements distance-template-id="my-template"></vertex-viewer-measurements>
        `,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const measurementEl = await el.addMeasurement(measurement1);

      expect(measurementEl).toHaveClass('my-class');
    });

    it('adds a default measurement element if distance template not found', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `
          <template id="my-template">
            <vertex-viewer-distance-measurement class="my-class"></vertex-viewer-distance-measurement>
          </template>
          <vertex-viewer-measurements distance-template-id="not-my-template"></vertex-viewer-measurements>
        `,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const measurementEl = await el.addMeasurement(measurement1);

      expect(measurementEl).not.toHaveClass('my-class');
    });

    it('adds a default measurement element if template does not contain measurement', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `
          <template id="my-template">
            <div></div>
          </template>
          <vertex-viewer-measurements distance-template-id="my-template"></vertex-viewer-measurements>
        `,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const measurementEl = await el.addMeasurement(measurement1);

      expect(measurementEl).not.toHaveClass('my-class');
    });

    it('emits event when measurement added programmatically', async () => {
      const onMeasurementAdded = jest.fn();
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-measurements onMeasurementAdded={onMeasurementAdded} />
        ),
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const measurementEl = await el.addMeasurement(measurement1);

      expect(onMeasurementAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: measurementEl,
        })
      );
    });

    it('emits event when measurement added through user interaction', async () => {
      const onMeasurementAdded = jest.fn();
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-measurements onMeasurementAdded={onMeasurementAdded} />
        ),
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      el.dispatchEvent(new CustomEvent('measureEnd', { detail: measurement1 }));

      expect(onMeasurementAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: el.firstElementChild,
        })
      );
    });
  });

  describe('removing measurements', () => {
    it('removes measurement containing id', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `<vertex-viewer-measurements></vertex-viewer-measurements>`,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      await el.addMeasurement(measurement1);
      await el.removeMeasurement(measurement1.id);

      expect(el.children).toHaveLength(0);
    });

    it('emits event when measurement removed programmatically', async () => {
      const onMeasurementRemoved = jest.fn();
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-measurements
            onMeasurementRemoved={onMeasurementRemoved}
          />
        ),
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const measurementEl = await el.addMeasurement(measurement1);
      await el.removeMeasurement(measurement1.id);

      expect(onMeasurementRemoved).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: measurementEl,
        })
      );
    });
  });

  describe('query measurements', () => {
    it('returns measurement with id', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `<vertex-viewer-measurements></vertex-viewer-measurements>`,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      await el.addMeasurement(measurement1);
      await el.addMeasurement(measurement2);

      const measurementEl = await el.getMeasurementElement(measurement2.id);
      expect(measurementEl?.id).toEqual(measurement2.id);
    });

    it('returns all measurements', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `<vertex-viewer-measurements></vertex-viewer-measurements>`,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      await el.addMeasurement(measurement1);
      await el.addMeasurement(measurement2);

      const measurements = await el.getMeasurementElements();
      expect(measurements).toHaveLength(2);
    });
  });

  describe('selecting measurements', () => {
    it('sets editing mode on selected measurement', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `<vertex-viewer-measurements></vertex-viewer-measurements>`,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      await el.addMeasurement(measurement1);
      await el.addMeasurement(measurement2);

      el.selectedMeasurementId = measurement2.id;
      await page.waitForChanges();

      const measurementEl = await el.getMeasurementElement(measurement2.id);
      expect(measurementEl?.mode).toEqual('edit');
    });

    it('selects measurement when pressed and not disabled', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `
          <vertex-viewer-measurements>
            <vertex-viewer-distance-measurement id="m1" class="provided"></vertex-viewer-distance-measurement>
            <vertex-viewer-distance-measurement class="provided"></vertex-viewer-distance-measurement>
          </vertex-viewer-measurements>
        `,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const provided = el.querySelectorAll('.provided');
      const measurementEl1 = provided[0];
      const measurementEl2 = provided[1];
      const measurementEl3 = await el.addMeasurement(measurement1);

      // Should select, measurement has ID
      measurementEl1.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await page.waitForChanges();
      expect(el.selectedMeasurementId).toEqual(measurementEl1.id);

      // Should not select, measurement does not have ID
      measurementEl2.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await page.waitForChanges();
      expect(el.selectedMeasurementId).toEqual(measurementEl1.id);

      // Should select, measurement has ID
      measurementEl3.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await page.waitForChanges();
      expect(el.selectedMeasurementId).toEqual(measurementEl3.id);
    });

    it('does not select measurement when pressed and disabled', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        html: `<vertex-viewer-measurements disabled></vertex-viewer-measurements>`,
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const measurementEl = await el.addMeasurement(measurement1);

      measurementEl.dispatchEvent(new Event('pointerdown', { bubbles: true }));

      expect(el.selectedMeasurementId).toBeUndefined();
    });
  });

  describe('measurement tool', () => {
    it('sets measurement tool with correct props', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-measurements
            distanceTemplateId="my-template"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            viewer={viewer as any}
          >
            <vertex-viewer-measurement-tool />
          </vertex-viewer-measurements>
        ),
      });

      const toolEl = page.root?.querySelector(
        'vertex-viewer-measurement-tool'
      ) as HTMLVertexViewerMeasurementToolElement;

      expect(toolEl.disabled).toBe(false);
      expect(toolEl.viewer).toBe(viewer);
      expect(toolEl.distanceTemplateId).toBe('my-template');
      expect(toolEl.tool).toBe('distance');
    });

    it('updates tool props when props change', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-measurements>
            <vertex-viewer-measurement-tool />
          </vertex-viewer-measurements>
        ),
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const toolEl = el.querySelector(
        'vertex-viewer-measurement-tool'
      ) as HTMLVertexViewerMeasurementToolElement;

      el.distanceTemplateId = 'my-template';
      await page.waitForChanges();
      expect(toolEl.distanceTemplateId).toBe('my-template');

      el.disabled = true;
      await page.waitForChanges();
      expect(toolEl.disabled).toBe(true);

      el.units = 'inches';
      await page.waitForChanges();
      expect(toolEl.units).toBe(el.units);

      el.fractionalDigits = 0;
      await page.waitForChanges();
      expect(toolEl.fractionalDigits).toBe(el.fractionalDigits);

      el.snapDistance = 10;
      await page.waitForChanges();
      expect(toolEl.snapDistance).toBe(el.snapDistance);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      el.viewer = viewer as any;
      await page.waitForChanges();
      expect(toolEl.viewer).toBe(viewer);
    });

    it('updates measurement props when props change', async () => {
      const page = await newSpecPage({
        components: [ViewerMeasurements, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-measurements>
            <vertex-viewer-measurement-tool />
          </vertex-viewer-measurements>
        ),
      });

      const el = page.root as HTMLVertexViewerMeasurementsElement;
      const measurementEl = await el.addMeasurement(measurement1);

      el.units = 'inches';
      await page.waitForChanges();
      expect(measurementEl.units).toBe(el.units);

      el.fractionalDigits = 0;
      await page.waitForChanges();
      expect(measurementEl.fractionalDigits).toBe(el.fractionalDigits);

      el.snapDistance = 10;
      await page.waitForChanges();
      expect(measurementEl.snapDistance).toBe(el.snapDistance);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      el.viewer = viewer as any;
      await page.waitForChanges();
      expect(measurementEl.viewer).toBe(viewer);
    });
  });
});
