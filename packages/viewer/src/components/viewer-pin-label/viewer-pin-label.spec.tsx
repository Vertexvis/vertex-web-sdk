jest.mock('../../lib/stencil', () => ({
  readDOM: jest.fn((fn) => fn()),
}));

const mockGetComputedStyle = jest.fn(() => ({
  height: '10px',
  borderWidth: '1px',
  lineHeight: '1px',
}));
jest.mock('./utils', () => ({
  getComputedStyle: mockGetComputedStyle,
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Dimensions, Point, Vector3 } from '@vertexvis/geometry';

import { PinController } from '../../lib/pins/controller';
import { PinModel, TextPin } from '../../lib/pins/model';
import { triggerResizeObserver } from '../../testing/resizeObserver';
import { VertexPinLabel } from './viewer-pin-label';

describe('vertex-viewer-pin-label', () => {
  function clickLabel(label: HTMLDivElement): void {
    label.dispatchEvent(
      new MouseEvent('pointerdown', {
        clientX: 50,
        clientY: 50,
      })
    );

    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 50,
      })
    );

    window.dispatchEvent(
      new MouseEvent('pointerup', {
        clientX: 50,
        clientY: 50,
      })
    );
  }

  it('should render a label for a pin and support dragging the label', async () => {
    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-text');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointCenterScreen = Point.create(0, 0);
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition,
      label: {
        point: relativePointCenterScreen,
        text: 'My New Pin',
      },
    };
    pinModel.addPin(pin);

    const page = await newSpecPage({
      components: [VertexPinLabel],
      template: () => (
        <vertex-viewer-pin-label
          elementBounds={dimensions as DOMRect}
          pin={pin}
          pinController={pinController}
        />
      ),
    });

    const el = page.root as HTMLVertexViewerPinLabelLineElement;

    const label = el.querySelector(
      '.pin-label-input-wrapper'
    ) as HTMLDivElement;

    expect(label.style.top).toBe('50px');
    expect(label.style.left).toBe('50px');

    const originalPin = pinModel.getPinById(pin.id) as TextPin;
    expect(originalPin.label.point).toEqual({ x: 0, y: 0 });
    label?.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 50, clientY: 50 })
    );

    const draggingPoint = Point.create(40, 90);
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: draggingPoint.x,
        clientY: draggingPoint.y,
      })
    );

    await page.waitForChanges();

    const updatedPin = pinModel.getPinById(pin.id) as TextPin;

    expect(updatedPin.label.point).toEqual({ x: -0.1, y: 0.4 });
  });

  it('should support changing the label', async () => {
    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-text');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointCenterScreen = Point.create(0, 0);
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition,
      label: {
        point: relativePointCenterScreen,
        text: 'My New Pin',
      },
    };
    pinController.addPin(pin);

    const page = await newSpecPage({
      components: [VertexPinLabel],
      template: () => (
        <vertex-viewer-pin-label
          elementBounds={dimensions as DOMRect}
          pin={pin}
          pinController={pinController}
        />
      ),
    });

    const el = page.root as HTMLVertexViewerPinLabelLineElement;

    const label = el.querySelector(
      '.pin-label-input-wrapper'
    ) as HTMLDivElement;
    const input = el.querySelector(
      `#pin-label-input-${pin.id}`
    ) as HTMLTextAreaElement;

    expect(input).toEqualHtml(`
      <textarea class="pin-label-input pin-label-text readonly" disabled="" id="pin-label-input-my-pin-id" rows="1" value="My New Pin"></textarea>
    `);

    const originalPin = pinModel.getPinById(pin.id) as TextPin;
    expect(originalPin.label.point).toEqual({ x: 0, y: 0 });
    clickLabel(label);

    await page.waitForChanges();

    expect(input).toEqualHtml(`
      <textarea class="pin-label-input pin-label-text" id="pin-label-input-my-pin-id" rows="1" value="My New Pin"></textarea>
    `);

    input.value = 'Updated Text';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));

    await page.waitForChanges();

    const updatedPin = pinModel.getPinById(pin.id) as TextPin;

    expect(updatedPin.label).toEqual({
      point: { x: 0, y: 0 },
      text: 'Updated Text',
    });
  });

  it('should support changing the label and pressing enter to submit', async () => {
    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-text');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointCenterScreen = Point.create(0, 0);
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition,
      label: {
        point: relativePointCenterScreen,
        text: 'My New Pin',
      },
    };
    pinController.addPin(pin);

    const page = await newSpecPage({
      components: [VertexPinLabel],
      template: () => (
        <vertex-viewer-pin-label
          elementBounds={dimensions as DOMRect}
          pin={pin}
          pinController={pinController}
        />
      ),
    });

    const el = page.root as HTMLVertexViewerPinLabelLineElement;

    const label = el.querySelector(
      '.pin-label-input-wrapper'
    ) as HTMLDivElement;
    const input = el.querySelector(
      `#pin-label-input-${pin.id}`
    ) as HTMLTextAreaElement;

    expect(input).toEqualHtml(`
      <textarea class="pin-label-input pin-label-text readonly" disabled="" id="pin-label-input-my-pin-id" rows="1" value="My New Pin"></textarea>
    `);

    const originalPin = pinModel.getPinById(pin.id) as TextPin;
    expect(originalPin.label.point).toEqual({ x: 0, y: 0 });

    clickLabel(label);

    await page.waitForChanges();

    expect(input).toEqualHtml(`
      <textarea class="pin-label-input pin-label-text" id="pin-label-input-my-pin-id" rows="1" value="My New Pin"></textarea>
    `);

    input.value = 'Updated Text With Enter';
    input.dispatchEvent(new Event('input'));

    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
      })
    );

    await page.waitForChanges();

    const updatedPin = pinModel.getPinById(pin.id) as TextPin;

    expect(updatedPin.label).toEqual({
      point: { x: 0, y: 0 },
      text: 'Updated Text With Enter',
    });
  });

  it('should set min/max width to constrain to the viewer dimensions', async () => {
    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-text');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointRightScreen = Point.create(0.4, 0);
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition,
      label: {
        point: relativePointRightScreen,
        text: 'My New Pin',
      },
    };
    pinController.addPin(pin);

    const page = await newSpecPage({
      components: [VertexPinLabel],
      template: () => (
        <vertex-viewer-pin-label
          elementBounds={dimensions as DOMRect}
          pin={pin}
          pinController={pinController}
        />
      ),
    });

    const el = page.root as HTMLVertexViewerPinLabelElement;
    const label = el.querySelector(
      '.pin-label-input-wrapper'
    ) as HTMLDivElement;
    const input = el.querySelector(
      `#pin-label-input-${pin.id}`
    ) as HTMLTextAreaElement;

    clickLabel(label);

    await page.waitForChanges();

    input.value = 'Some really long text that will overflow';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
    );

    await page.waitForChanges();

    triggerResizeObserver([
      {
        contentRect: { width: 10, height: 10 },
      },
    ]);

    await page.waitForChanges();

    expect(label.style.maxWidth).toBe(
      'min(var(--viewer-annotations-pin-label-max-width), calc(100px - 90px))'
    );
    expect(label.style.minWidth).toBe(
      'min(16px, min(var(--viewer-annotations-pin-label-max-width), calc(100px - 90px)))'
    );
  });

  it('should set max height to constrain to the viewer dimensions', async () => {
    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-text');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointRightScreen = Point.create(0, 0.4);
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition,
      label: {
        point: relativePointRightScreen,
        text: 'My New Pin',
      },
    };
    pinController.addPin(pin);

    const page = await newSpecPage({
      components: [VertexPinLabel],
      template: () => (
        <vertex-viewer-pin-label
          elementBounds={dimensions as DOMRect}
          pin={pin}
          pinController={pinController}
        />
      ),
    });

    const el = page.root as HTMLVertexViewerPinLabelElement;
    const label = el.querySelector(
      '.pin-label-input-wrapper'
    ) as HTMLDivElement;
    const input = el.querySelector(
      `#pin-label-input-${pin.id}`
    ) as HTMLTextAreaElement;

    clickLabel(label);

    await page.waitForChanges();

    input.value = 'Some really long text that will overflow';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
    );

    await page.waitForChanges();

    triggerResizeObserver([{ contentRect: { width: 10, height: 10 } }]);

    await page.waitForChanges();

    expect(label.style.maxHeight).toBe(
      'min(var(--viewer-annotations-pin-label-max-height), calc(100px - 90px))'
    );
  });

  it('should compute the row count based on the hidden content element', async () => {
    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-text');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointRightScreen = Point.create(0, 0.4);
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition,
      label: {
        point: relativePointRightScreen,
        text: 'My New Pin',
      },
    };
    pinController.addPin(pin);

    const page = await newSpecPage({
      components: [VertexPinLabel],
      template: () => (
        <vertex-viewer-pin-label
          elementBounds={dimensions as DOMRect}
          pin={pin}
          pinController={pinController}
        />
      ),
    });

    const el = page.root as HTMLVertexViewerPinLabelElement;
    const label = el.querySelector(
      '.pin-label-input-wrapper'
    ) as HTMLDivElement;
    const input = el.querySelector(
      `#pin-label-input-${pin.id}`
    ) as HTMLTextAreaElement;

    clickLabel(label);

    await page.waitForChanges();

    input.value = 'Some really long text that will overflow';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
    );

    await page.waitForChanges();

    mockGetComputedStyle.mockReturnValue({
      height: '48px',
      borderWidth: '2px',
      lineHeight: '16px',
    });

    triggerResizeObserver([
      {
        contentRect: { width: 10, height: 10 },
      },
    ]);

    await page.waitForChanges();

    expect(input.getAttribute('rows')).toBe('3');
  });
});
