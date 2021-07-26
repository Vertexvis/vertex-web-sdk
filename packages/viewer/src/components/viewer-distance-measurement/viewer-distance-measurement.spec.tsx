jest.mock('../viewer/utils');
jest.mock('./dom');

import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Point, Vector3 } from '@vertexvis/geometry';
import {
  FramePerspectiveCamera,
  STENCIL_BUFFER_EMPTY_COLOR,
  Viewport,
} from '../../lib/types';
import { ViewerDistanceMeasurement } from './viewer-distance-measurement';
import { getMeasurementBoundingClientRect } from './dom';
import { loadModelForViewer } from '../../testing/viewer';
import { getElementBoundingClientRect } from '../viewer/utils';
import { Viewer } from '../viewer/viewer';
import { ViewerLayer } from '../viewer-layer/viewer-layer';
import * as Fixtures from '../../testing/fixtures';
import { Color } from '@vertexvis/utils';

describe('vertex-viewer-distance-measurement', () => {
  const camera = new FramePerspectiveCamera(
    Vector3.create(0, 0, 100),
    Vector3.origin(),
    Vector3.up(),
    0.01,
    100,
    1,
    45
  );
  const projectionViewMatrix = camera.projectionViewMatrix;
  const start = Vector3.create(1, 1, 1);
  const end = Vector3.create(2, 2, 2);
  const viewport = new Viewport(100, 100);

  const startNdc = Vector3.transformMatrix(start, projectionViewMatrix);
  const endNdc = Vector3.transformMatrix(end, projectionViewMatrix);

  const depthBuffer = Fixtures.createDepthBuffer(100, 100, 0);
  const stencilBuffer = Fixtures.createStencilBuffer(100, 100, ({ x }) =>
    x > 49 ? Color.create(255, 255, 255) : STENCIL_BUFFER_EMPTY_COLOR
  );

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
          camera={camera}
        />
      ),
    });

    const startEl = page.root?.shadowRoot?.getElementById('start-anchor');
    const endEl = page.root?.shadowRoot?.getElementById('end-anchor');

    const startPt = viewport.transformVectorToViewport(startNdc);
    const endPt = viewport.transformVectorToViewport(endNdc);

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
          camera={camera}
        />
      ),
    });

    const startEl = page.root?.shadowRoot?.getElementById('start-anchor');
    const endEl = page.root?.shadowRoot?.getElementById('end-anchor');

    const startPt = viewport.transformVectorToViewport(startNdc);
    const endPt = viewport.transformVectorToViewport(endNdc);

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
          camera={camera}
        />
      ),
    });

    const labelEl = page.root?.shadowRoot?.getElementById('label');
    const startPt = viewport.transformVectorToViewport(startNdc);
    const endPt = viewport.transformVectorToViewport(endNdc);
    const centerPt = Point.lerp(startPt, endPt, 0.5);

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
          camera={camera}
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
          camera={camera}
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

    const startPt = viewport.transformVectorToViewport(newStartNdc);
    const endPt = viewport.transformVectorToViewport(newEndNdc);

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
      template: () => (
        <vertex-viewer-distance-measurement
          anchorLabelOffset={25}
          startJson="[0, 0, 0]"
          endJson="[0, 0, 0]"
          camera={camera}
          depthBuffer={depthBuffer}
        >
          <div id="start-label" slot="start-label"></div>
          <div id="end-label" slot="end-label"></div>
        </vertex-viewer-distance-measurement>
      ),
    });

    const startLabelEl = page.root?.shadowRoot?.querySelector(
      '.anchor-label-start'
    ) as HTMLElement | undefined;
    const endLabelEl = page.root?.shadowRoot?.querySelector(
      '.anchor-label-end'
    ) as HTMLElement | undefined;

    expect(startLabelEl?.style.transform).toContain('translate(25px, 50px)');
    expect(endLabelEl?.style.transform).toContain('translate(75px, 50px)');
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
          camera={camera}
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
          camera={camera}
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
          camera={camera}
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
          camera={camera}
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
    const startPt = viewport.transformVectorToViewport(startNdc);
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
            camera={camera}
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
    const depthBuffer = Fixtures.createDepthBuffer(100, 100, 0);
    const snapEvent = { clientX: 45, clientY: 50 };
    const snapPt = viewport.transformPointToWorldSpace(
      Point.create(50, 50),
      depthBuffer
    );

    it('does not update anchor if measurement is not editable', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            camera={camera}
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

    it('does not update anchor if not primary button', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            camera={camera}
            mode="edit"
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('start-anchor');
      anchor?.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
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
            camera={camera}
            mode="edit"
            onEditBegin={onEditBegin}
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('start-anchor');
      anchor?.dispatchEvent(new MouseEvent('pointerdown', { button: 0 }));

      expect(onEditBegin).toHaveBeenCalled();
    });

    it('updates start point when anchor is moved', async () => {
      const page = await newSpecPage({
        components: [Viewer, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer>
            <vertex-viewer-distance-measurement
              start={start}
              end={end}
              depthBuffer={depthBuffer}
              camera={camera}
              mode="edit"
            />
          </vertex-viewer>
        ),
      });

      const viewer = page.root as HTMLVertexViewerElement;
      jest
        .spyOn(viewer.stencilBuffer, 'latestAfterInteraction')
        .mockResolvedValue(stencilBuffer);

      const measurement = viewer.querySelector(
        'vertex-viewer-distance-measurement'
      ) as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('start-anchor');

      anchor?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 })
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );
      await page.waitForChanges();
      expect(measurement.start).not.toEqual(start);

      // Test snapping
      await viewer.stencilBuffer.latestAfterInteraction();
      window.dispatchEvent(new MouseEvent('pointermove', snapEvent));
      await page.waitForChanges();
      expect(measurement.start).toEqual(snapPt);

      window.dispatchEvent(
        new MouseEvent('pointermove', { ...snapEvent, shiftKey: true })
      );
      await page.waitForChanges();
      expect(measurement.start).not.toEqual(snapPt);
    });

    it('updates end point when anchor is moved', async () => {
      const page = await newSpecPage({
        components: [ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer-distance-measurement
            start={start}
            end={end}
            depthBuffer={depthBuffer}
            camera={camera}
            mode="edit"
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('end-anchor');
      anchor?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 })
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      await page.waitForChanges();

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
            camera={camera}
            onEditEnd={onEditEnd}
            mode="edit"
          />
        ),
      });

      const measurement = page.root as HTMLVertexViewerDistanceMeasurementElement;
      const anchor = measurement.shadowRoot?.getElementById('start-anchor');
      anchor?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 })
      );
      window.dispatchEvent(new MouseEvent('pointerup'));

      await page.waitForChanges();

      expect(onEditEnd).toHaveBeenCalled();
    });
  });

  describe('replace mode', () => {
    const depthBuffer = Fixtures.createDepthBuffer(100, 100, 0);
    const snapEvent = { clientX: 45, clientY: 50 };
    const snapPt = viewport.transformPointToWorldSpace(
      Point.create(50, 50),
      depthBuffer
    );

    it('updates start pt on pointer move', async () => {
      const page = await newSpecPage({
        components: [Viewer, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer>
            <vertex-viewer-distance-measurement
              start={start}
              end={end}
              depthBuffer={depthBuffer}
              camera={camera}
              mode="replace"
            />
          </vertex-viewer>
        ),
      });

      const viewer = page.root as HTMLVertexViewerElement;
      jest
        .spyOn(viewer.stencilBuffer, 'latestAfterInteraction')
        .mockResolvedValue(stencilBuffer);

      const measurement = viewer.querySelector(
        'vertex-viewer-distance-measurement'
      ) as HTMLVertexViewerDistanceMeasurementElement;

      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );
      await page.waitForChanges();
      expect(measurement.start).not.toEqual(start);

      // Test snapping
      await viewer.stencilBuffer.latestAfterInteraction();
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointermove', snapEvent)
      );
      await page.waitForChanges();
      expect(measurement.start).toEqual(snapPt);
    });

    it('does nothing if not primary button', async () => {
      const onEditBegin = jest.fn();
      const onEditEnd = jest.fn();
      const page = await newSpecPage({
        components: [Viewer, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer>
            <vertex-viewer-distance-measurement
              start={start}
              end={end}
              depthBuffer={depthBuffer}
              camera={camera}
              mode="replace"
              onEditBegin={onEditBegin}
              onEditEnd={onEditEnd}
            />
          </vertex-viewer>
        ),
      });

      const viewer = page.root as HTMLVertexViewerElement;
      const measurement = viewer.querySelector(
        'vertex-viewer-distance-measurement'
      ) as HTMLVertexViewerDistanceMeasurementElement;

      // update start
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      // begin interaction
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 10, clientY: 10, button: 1 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 10, clientY: 10 })
      );
      await page.waitForChanges();
      expect(onEditBegin).not.toHaveBeenCalled();

      // move end anchor
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 20, clientY: 20 })
      );
      await page.waitForChanges();
      expect(measurement.end).toEqual(end);

      // end interaction
      window.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 20, clientY: 20 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 20, clientY: 20 })
      );
      await page.waitForChanges();
      expect(onEditEnd).not.toHaveBeenCalled();
    });

    it('updates end pt on interaction', async () => {
      const onEditBegin = jest.fn();
      const onEditEnd = jest.fn();
      const page = await newSpecPage({
        components: [Viewer, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer>
            <vertex-viewer-distance-measurement
              start={start}
              end={end}
              depthBuffer={depthBuffer}
              camera={camera}
              mode="replace"
              onEditBegin={onEditBegin}
              onEditEnd={onEditEnd}
            />
          </vertex-viewer>
        ),
      });

      const viewer = page.root as HTMLVertexViewerElement;
      jest
        .spyOn(viewer.stencilBuffer, 'latestAfterInteraction')
        .mockResolvedValue(stencilBuffer);

      const measurement = viewer.querySelector(
        'vertex-viewer-distance-measurement'
      ) as HTMLVertexViewerDistanceMeasurementElement;

      // update start
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      // begin interaction
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 10, clientY: 10, button: 0 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 10, clientY: 10 })
      );
      await page.waitForChanges();
      expect(onEditBegin).toHaveBeenCalled();

      // move end anchor
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 20, clientY: 20 })
      );
      await page.waitForChanges();
      expect(measurement.end).not.toEqual(end);

      // snap end anchor
      await viewer.stencilBuffer.latestAfterInteraction();
      window.dispatchEvent(new MouseEvent('pointermove', snapEvent));
      await page.waitForChanges();
      expect(measurement.end).toEqual(snapPt);

      // end interaction
      window.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 20, clientY: 20 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 20, clientY: 20 })
      );
      await page.waitForChanges();
      expect(onEditEnd).toHaveBeenCalled();
    });

    it('cancels begin interaction if mouse moved during first mouse down', async () => {
      const onEditBegin = jest.fn();
      const onEditEnd = jest.fn();
      const page = await newSpecPage({
        components: [Viewer, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer>
            <vertex-viewer-distance-measurement
              start={start}
              end={end}
              depthBuffer={depthBuffer}
              camera={camera}
              mode="replace"
              onEditBegin={onEditBegin}
              onEditEnd={onEditEnd}
            />
          </vertex-viewer>
        ),
      });

      const viewer = page.root as HTMLVertexViewerElement;
      const measurement = viewer.querySelector(
        'vertex-viewer-distance-measurement'
      ) as HTMLVertexViewerDistanceMeasurementElement;

      // update start
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      // begin interaction
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 10, clientY: 10, button: 0 })
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

      await page.waitForChanges();

      expect(measurement.end).toEqual(end);

      expect(onEditBegin).not.toHaveBeenCalled();
      expect(onEditEnd).not.toHaveBeenCalled();
    });

    it('skips end interaction if mouse moved during last pointer end', async () => {
      const onEditBegin = jest.fn();
      const onEditEnd = jest.fn();
      const page = await newSpecPage({
        components: [Viewer, ViewerDistanceMeasurement],
        template: () => (
          <vertex-viewer>
            <vertex-viewer-distance-measurement
              start={start}
              end={end}
              depthBuffer={depthBuffer}
              camera={camera}
              mode="replace"
              onEditBegin={onEditBegin}
              onEditEnd={onEditEnd}
            />
          </vertex-viewer>
        ),
      });

      const viewer = page.root as HTMLVertexViewerElement;
      const measurement = viewer.querySelector(
        'vertex-viewer-distance-measurement'
      ) as HTMLVertexViewerDistanceMeasurementElement;

      // update start
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 10, clientY: 10 })
      );

      // begin interaction
      viewer.interactionTarget?.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 10, clientY: 10, button: 0 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 10, clientY: 10 })
      );
      await page.waitForChanges();
      expect(onEditBegin).toHaveBeenCalled();

      // move end anchor
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 20, clientY: 20 })
      );
      await page.waitForChanges();
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
      await page.waitForChanges();
      expect(onEditEnd).not.toHaveBeenCalled();

      // end interaction
      window.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 30, clientY: 30 })
      );
      window.dispatchEvent(
        new MouseEvent('pointerup', { clientX: 30, clientY: 30 })
      );
      await page.waitForChanges();
      expect(onEditEnd).toHaveBeenCalled();
    });
  });
});
