// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { describe, expect, h, it, render } from '@stencil/vitest';
import { Dimensions, Point, Vector3 } from '@vertexvis/geometry';

import { PinController } from '../../lib/pins/controller';
import { PinModel, TextPin } from '../../lib/pins/model';

describe('vertex-viewer-pin-label render', () => {
  it('renders a label for a pin and supports dragging the label', async () => {
    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-text');
    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition: Vector3.create(),
      label: {
        point: Point.create(0, 0),
        text: 'My New Pin',
      },
    };
    pinModel.addPin(pin);

    // The custom-elements build applies a class while the Stencil config
    // asks render() to wait for a hydrated attribute.
    const { root, waitForChanges } = await render(
      <vertex-viewer-pin-label
        elementBounds={dimensions as DOMRect}
        pin={pin}
        pinController={pinController}
      />,
      { waitForReady: false },
    );
    await waitForChanges();

    const label = root.querySelector(
      '.pin-label-input-wrapper',
    ) as HTMLDivElement;
    expect(label.style.top).toBe('50px');
    expect(label.style.left).toBe('50px');
    expect((pinModel.getPinById(pin.id) as TextPin).label.point).toEqual({
      x: 0,
      y: 0,
    });

    label.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 50, clientY: 50 }),
    );
    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 40, clientY: 90 }),
    );
    await waitForChanges();

    expect((pinModel.getPinById(pin.id) as TextPin).label.point).toEqual({
      x: -0.1,
      y: 0.4,
    });
  });
});
