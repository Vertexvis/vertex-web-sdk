// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Dimensions, Point, Vector3 } from '@vertexvis/geometry';

import { PinController } from '../../lib/pins/controller';
import { PinModel, TextPin } from '../../lib/pins/model';
import { VertexPinLabel } from './viewer-pin-label';

describe('vertex-viewer-pin-label', () => {
  it('should render a label for a pin and support dragging the label', async () => {
    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-label');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointCenterScreen = Point.create(0, 0);
    const pin = {
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

    const labelLine = el.querySelector(`#pin-label-${pin.id}`);

    expect(labelLine).toEqualHtml(`
      <div class="pin-label" id="pin-label-my-pin-id" style="top: 50px; left: 50px;">
        My New Pin
      </div>
    `);

    const originalPin = pinModel.getPinById(pin.id) as TextPin;
    expect(originalPin.label.point).toEqual({ x: 0, y: 0 });
    labelLine?.dispatchEvent(new MouseEvent('pointerdown'));

    const draggingPoint = Point.create(40, 90);
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: draggingPoint.x,
        clientY: draggingPoint.y,
      })
    );

    await page.waitForChanges();

    expect(el.querySelector(`#pin-label-${pin.id}`)).toEqualHtml(`
      <div class="pin-label" id="pin-label-my-pin-id" style="top: 50px; left: 50px;">
        My New Pin
      </div>
    `);

    const updatedPin = pinModel.getPinById(pin.id) as TextPin;

    expect(updatedPin.label.point).toEqual({ x: -0.1, y: 0.4 });
  });

  it('should support changing the label', async () => {
    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-label');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointCenterScreen = Point.create(0, 0);
    const pin = {
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

    const labelLine = el.querySelector(`#pin-label-${pin.id}`);

    expect(labelLine).toEqualHtml(`
      <div class="pin-label" id="pin-label-my-pin-id" style="top: 50px; left: 50px;">
        My New Pin
      </div>
    `);

    const originalPin = pinModel.getPinById(pin.id) as TextPin;
    expect(originalPin.label.point).toEqual({ x: 0, y: 0 });
    labelLine?.dispatchEvent(
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

    await page.waitForChanges();

    expect(el.querySelector(`#pin-label-${pin.id}`)).toEqualHtml(`
      <input class="pin-label" id="pin-label-my-pin-id" type="text" value="My New Pin" style="top: 50px; left: 50px;">
    `);

    const input = page.root?.querySelector(
      `#pin-label-${pin?.id}`
    ) as HTMLInputElement;

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
    const pinController = new PinController(pinModel, 'edit', 'pin-label');

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const relativePointCenterScreen = Point.create(0, 0);
    const pin = {
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

    const labelLine = el.querySelector(`#pin-label-${pin.id}`);

    expect(labelLine).toEqualHtml(`
      <div class="pin-label" id="pin-label-my-pin-id" style="top: 50px; left: 50px;">
        My New Pin
      </div>
    `);

    const originalPin = pinModel.getPinById(pin.id) as TextPin;
    expect(originalPin.label.point).toEqual({ x: 0, y: 0 });
    labelLine?.dispatchEvent(
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

    await page.waitForChanges();

    expect(el.querySelector(`#pin-label-${pin.id}`)).toEqualHtml(`
      <input class="pin-label" id="pin-label-my-pin-id" type="text" value="My New Pin" style="top: 50px; left: 50px;">
    `);

    const input = page.root?.querySelector(
      `#pin-label-${pin?.id}`
    ) as HTMLInputElement;

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
});