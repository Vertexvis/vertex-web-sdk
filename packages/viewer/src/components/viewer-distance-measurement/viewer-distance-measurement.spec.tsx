jest.mock('../viewer/utils');
jest.mock('./dom');

import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Line3, Matrix4, Vector3 } from '@vertexvis/geometry';
import { Viewport } from '../../lib/types';
import { ViewerDistanceMeasurement } from './viewer-distance-measurement';
import { getMeasurementBoundingClientRect } from './dom';
import { loadModelForViewer } from '../../testing/viewer';
import { getElementBoundingClientRect } from '../viewer/utils';
import { Viewer } from '../viewer/viewer';
import { ViewerLayer } from '../viewer-layer/viewer-layer';
import * as Fixtures from '../../testing/fixtures';

describe('vertex-viewer-distance-measurement', () => {
  const projectionViewMatrix = Matrix4.makeIdentity();
  const start = Vector3.create(1, 1, 1);
  const end = Vector3.create(2, 2, 2);
  const viewport = new Viewport(100, 100);

  const startNdc = Vector3.transformMatrix(start, projectionViewMatrix);
  const endNdc = Vector3.transformMatrix(end, projectionViewMatrix);
  const centerNdc = Line3.center(Line3.create({ start, end }));

  (getElementBoundingClientRect as jest.Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 150,
    right: 200,
    width: 200,
    height: 150,
  });

  (getMeasurementBoundingClientRect as jest.Mock).mockReturnValue({
    width: 100,
    height: 100,
  });

  it('positions the start and end anchors as Vector3 objects', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          start={start}
          end={end}
          projectionViewMatrix={projectionViewMatrix}
        ></vertex-viewer-distance-measurement>
      ),
    });

    const startEl = page.root?.shadowRoot?.getElementById('start-anchor');
    const endEl = page.root?.shadowRoot?.getElementById('end-anchor');

    const startPt = viewport.transformPointToViewport(startNdc);
    const endPt = viewport.transformPointToViewport(endNdc);

    expect(startEl?.style.transform).toContain(
      `translate(${startPt.x}px, ${startPt.y}px)`
    );
    expect(endEl?.style.transform).toContain(
      `translate(${endPt.x}px, ${endPt.y}px)`
    );
  });

  it('positions the start and end anchors as JSON strings', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          startJson={`[${start.x}, ${start.y}, ${start.z}]`}
          endJson={`[${end.x}, ${end.y}, ${end.z}]`}
          projectionViewMatrix={projectionViewMatrix}
        />
      ),
    });

    const startEl = page.root?.shadowRoot?.getElementById('start-anchor');
    const endEl = page.root?.shadowRoot?.getElementById('end-anchor');

    const startPt = viewport.transformPointToViewport(startNdc);
    const endPt = viewport.transformPointToViewport(endNdc);

    expect(startEl?.style.transform).toContain(
      `translate(${startPt.x}px, ${startPt.y}px)`
    );
    expect(endEl?.style.transform).toContain(
      `translate(${endPt.x}px, ${endPt.y}px)`
    );
  });

  it('positions the label between the start and end anchors', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          start={start}
          end={end}
          projectionViewMatrix={projectionViewMatrix}
        />
      ),
    });

    const labelEl = page.root?.shadowRoot?.getElementById('label');
    const centerPt = viewport.transformPointToViewport(centerNdc);

    expect(labelEl?.style.transform).toContain(
      `translate(${centerPt.x}px, ${centerPt.y}px)`
    );
  });

  it('positions anchors and labels to element center', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          start={start}
          end={end}
          projectionViewMatrix={projectionViewMatrix}
        />
      ),
    });

    const startEl = page.root?.shadowRoot?.getElementById('start-anchor');
    const endEl = page.root?.shadowRoot?.getElementById('end-anchor');
    const labelEl = page.root?.shadowRoot?.getElementById('label');

    const expected = 'translate(-50%, -50%) translate(';

    expect(startEl?.style.transform).toContain(expected);
    expect(endEl?.style.transform).toContain(expected);
    expect(labelEl?.style.transform).toContain(expected);
  });

  it('update positions of anchors when start or end changes', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          start={start}
          end={end}
          projectionViewMatrix={projectionViewMatrix}
        />
      ),
    });

    const newStart = Vector3.create(0, 0, 0);
    const newEnd = Vector3.create(1, 1, 1);

    const newStartNdc = Vector3.transformMatrix(newStart, projectionViewMatrix);
    const newEndNdc = Vector3.transformMatrix(newEnd, projectionViewMatrix);
    const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
    measurement.start = newStart;
    measurement.end = newEnd;

    await page.waitForChanges();

    const startEl = page.root?.shadowRoot?.getElementById('start-anchor');
    const endEl = page.root?.shadowRoot?.getElementById('end-anchor');

    const startPt = viewport.transformPointToViewport(newStartNdc);
    const endPt = viewport.transformPointToViewport(newEndNdc);

    expect(startEl?.style.transform).toContain(
      `translate(${startPt.x}px, ${startPt.y}px)`
    );
    expect(endEl?.style.transform).toContain(
      `translate(${endPt.x}px, ${endPt.y}px)`
    );
  });

  it('supports slots for anchor labels', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      html: `
        <vertex-viewer-distance-measurement>
          <div id="start-label" slot="start-label"></div>
          <div id="end-label" slot="end-label"></div>
        </vertex-viewer-distance-measurement>
      `,
    });

    const startLabelEl = page.root?.querySelector('#start-label');
    const endLabelEl = page.root?.querySelector('#end-label');

    expect(startLabelEl).toBeDefined();
    expect(endLabelEl).toBeDefined();
  });

  it('positions anchor labels with distance property', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      html: `
        <vertex-viewer-distance-measurement anchor-label-offset="50" start-json="[0, 0, 0]" end-json="[0, 0, 0]">
          <div id="start-label" slot="start-label"></div>
          <div id="end-label" slot="end-label"></div>
        </vertex-viewer-distance-measurement>
      `,
    });

    const startLabelEl = page.root?.shadowRoot?.querySelector(
      '.anchor-label-start'
    );
    const endLabelEl = page.root?.shadowRoot?.querySelector(
      '.anchor-label-end'
    );

    expect(startLabelEl).toBeDefined();
    expect(endLabelEl).toBeDefined();
  });

  it('is empty if start and end points cant be calculated', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      html: `<vertex-viewer-distance-measurement></vertex-viewer-distance-measurement>`,
    });

    expect(page.root?.shadowRoot?.getElementById('start-anchor')).toBeNull();
  });

  it('formats distance with specified units and fractional digits', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          startJson="[0, 0, 0]"
          endJson="[25.4, 0, 0]"
          units="inches"
          fractionalDigits={3}
          projectionViewMatrix={projectionViewMatrix}
        ></vertex-viewer-distance-measurement>
      ),
    });

    const labelEl = page.root?.shadowRoot?.getElementById('label');
    expect(labelEl).toEqualText(`~1.000 in`);
  });

  it('displays dashes if measurement invalid', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          startJson="[0, 0, 0]"
          endJson="[25.4, 0, 0]"
          units="inches"
          fractionalDigits={3}
          projectionViewMatrix={projectionViewMatrix}
          invalid
        ></vertex-viewer-distance-measurement>
      ),
    });

    const labelEl = page.root?.shadowRoot?.getElementById('label');
    expect(labelEl).toEqualText('---');
  });

  it('formats distance with provided label formatter', async () => {
    const labelFormatter = jest.fn().mockReturnValue('test');
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          startJson="[0, 0, 0]"
          endJson="[1000, 0, 0]"
          units="meters"
          labelFormatter={labelFormatter}
          projectionViewMatrix={projectionViewMatrix}
        />
      ),
    });

    const labelEl = page.root?.shadowRoot?.getElementById('label');
    expect(labelEl?.textContent).toBe(`test`);
    expect(labelFormatter).toHaveBeenCalledWith(1);
  });

  it('updates label when units change', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer-distance-measurement
          startJson="[0, 0, 0]"
          endJson="[1000, 0, 0]"
          units="millimeters"
          projectionViewMatrix={projectionViewMatrix}
        />
      ),
    });

    const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
    measurement.units = 'meters';

    await page.waitForChanges();

    const labelEl = page.root?.shadowRoot?.getElementById('label');
    expect(labelEl?.textContent).toBe(`~1.00 m`);
  });

  it('rerenders when viewer renders', async () => {
    const page = await newSpecPage({
      components: [Viewer, ViewerLayer, ViewerDistanceMeasurement],
      template: () => (
        <vertex-viewer>
          <vertex-viewer-measurements>
            <vertex-viewer-distance-measurement start={start} end={end} />
          </vertex-viewer-measurements>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;

    await loadModelForViewer(viewer);
    await page.waitForChanges();

    const startNdc = Vector3.transformMatrix(
      start,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      viewer.frame!.scene.camera.projectionViewMatrix
    );
    const startPt = viewport.transformPointToViewport(startNdc);
    const startEl = page.body
      .querySelector('vertex-viewer-distance-measurement')
      ?.shadowRoot?.getElementById('start-anchor');

    expect(startEl?.style.transform).toContain(
      `translate(${startPt.x}px, ${startPt.y}px)`
    );
  });

  describe(ViewerDistanceMeasurement.prototype.computeElementMetrics, () => {
    it('returns metrics for rendered elements', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            projectionViewMatrix={projectionViewMatrix}
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const metrics = await measurement.computeElementMetrics();

      expect(metrics).toMatchObject({
        startAnchor: expect.anything(),
        endAnchor: expect.anything(),
        label: expect.anything(),
      });
    });

    it('returns undefined if anchors are not visible', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => <vertex-viewer-distance-measurement />,
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const metrics = await measurement.computeElementMetrics();
      expect(metrics).toBeUndefined();
    });
  });

  describe('edit mode', () => {
    const depthBuffer = Fixtures.createDepthBuffer(100, 50, 0);

    it('does not update anchor if measurement is not editable', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('start-anchor');
      anchor?.dispatchEvent(new MouseEvent('mousedown'));
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 100, clientY: 100 })
      );

      expect(measurement.start).toEqual(start);
    });

    it('emits editBegin event when anchor editing started', async () => {
      const onEditBegin = jest.fn();

      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
            mode="edit"
            onEditBegin={onEditBegin}
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('start-anchor');
      anchor?.dispatchEvent(new MouseEvent('pointerdown'));

      expect(onEditBegin).toHaveBeenCalled();
    });

    it('updates start point when anchor is moved', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
            mode="edit"
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('start-anchor');
      anchor?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      expect(measurement.start).not.toEqual(start);
    });

    it('updates end point when anchor is moved', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
            mode="edit"
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('end-anchor');
      anchor?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      expect(measurement.end).not.toEqual(end);
    });

    it('emits edit end event on anchor mouse up', async () => {
      const onEditEnd = jest.fn();
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
            onEditEnd={onEditEnd}
            mode="edit"
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('start-anchor');
      anchor?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
      );
      window.dispatchEvent(new MouseEvent('pointerup'));

      expect(onEditEnd).toHaveBeenCalled();
    });
  });

  describe('replace mode', () => {
    const depthBuffer = Fixtures.createDepthBuffer(100, 50, 0);

    it('updates start pt on pointer move', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
            mode="replace"
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const contentEl = page.root?.shadowRoot?.querySelector('.measurement');
      contentEl?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      expect(measurement.start).not.toEqual(start);
    });

    it('updates end pt on interaction', async () => {
      const onEditBegin = jest.fn();
      const onEditEnd = jest.fn();
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
            mode="replace"
            onEditBegin={onEditBegin}
            onEditEnd={onEditEnd}
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const contentEl = page.root?.shadowRoot?.querySelector('.measurement');

      // update start
      contentEl?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      // begin interaction
      contentEl?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 10, clientY: 10 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 10, clientY: 10 })
      );
      expect(onEditBegin).toHaveBeenCalled();

      // move end anchor
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 20, clientY: 20 })
      );
      expect(measurement.end).not.toEqual(end);

      // end interaction
      window.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 20, clientY: 20 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 20, clientY: 20 })
      );

      expect(onEditEnd).toHaveBeenCalled();
    });

    it('cancels begin interaction if mouse moved during first mouse down', async () => {
      const onEditBegin = jest.fn();
      const onEditEnd = jest.fn();
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
            mode="replace"
            onEditBegin={onEditBegin}
            onEditEnd={onEditEnd}
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const contentEl = page.root?.shadowRoot?.querySelector('.measurement');

      // update start
      contentEl?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      // begin interaction
      contentEl?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 10, clientY: 10 })
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 20, clientY: 20, buttons: 1 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 20, clientY: 20 })
      );

      // move mouse after canceled
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 20, clientY: 20 })
      );

      expect(measurement.end).toEqual(end);

      expect(onEditBegin).not.toHaveBeenCalled();
      expect(onEditEnd).not.toHaveBeenCalled();
    });

    it('skips end interaction if mouse moved during last pointer end', async () => {
      const onEditBegin = jest.fn();
      const onEditEnd = jest.fn();
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            projectionViewMatrix={projectionViewMatrix}
            mode="replace"
            onEditBegin={onEditBegin}
            onEditEnd={onEditEnd}
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const contentEl = page.root?.shadowRoot?.querySelector('.measurement');

      // update start
      contentEl?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      // begin interaction
      contentEl?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 10, clientY: 10 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 10, clientY: 10 })
      );
      expect(onEditBegin).toHaveBeenCalled();

      // move end anchor
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 20, clientY: 20 })
      );
      expect(measurement.end).not.toEqual(end);

      // rotate model interaction
      window.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 20, clientY: 20 })
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 30, clientY: 30 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 30, clientY: 30 })
      );
      expect(onEditEnd).not.toHaveBeenCalled();

      // end interaction
      window.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 30, clientY: 30 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 30, clientY: 30 })
      );
      expect(onEditEnd).toHaveBeenCalled();
    });
  });
});
