import '../viewer-dom-element/viewer-dom-element';
import '../viewer-pin-label/viewer-pin-label';
import '../viewer-pin-label-line/viewer-pin-label-line';
import './viewer-pin-group';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { renderSource as render } from '#test/render-spec-page';

import { IconPin, PinModel, TextPin } from '../../lib/pins/model';
import { getClosestCenterToPoint } from './utils';

describe('vertex-view-pin-group', () => {
  it('should render a text pin', async () => {
    const worldPosition = Vector3.create();
    const viewMatrix = Matrix4.makeIdentity();

    const relativePointCenterScreen = Point.create(0, 0);
    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin: TextPin = {
      id: 'my-pin-id',
      type: 'text',
      worldPosition,
      label: {
        point: relativePointCenterScreen,
        text: 'My New Pin',
      },
    };

    const page = await render(
      <vertex-viewer-pin-group
        data-is-dom-group-element={true}
        pin={pin}
        elementBounds={dimensions as DOMRect}
        projectionViewMatrix={viewMatrix}
        selected={false}
      ></vertex-viewer-pin-group>,
    );

    const el = page.root as HTMLVertexViewerPinGroupElement;

    const anchor = el.querySelector('#pin-anchor');
    const line = el.querySelector('vertex-viewer-pin-label-line line');
    const label = el.querySelector('vertex-viewer-pin-label');
    expect(anchor).not.toBeNull();
    expect(line).not.toBeNull();
    expect(label?.textContent).toContain('My New Pin');
  });

  it('should support passing primary/accent colors for a text pin', async () => {
    const worldPosition = Vector3.create();
    const viewMatrix = Matrix4.makeIdentity();

    const relativePointCenterScreen = Point.create(0, 0);
    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin: TextPin = {
      id: 'my-pin-id',
      type: 'text',
      worldPosition,
      label: {
        point: relativePointCenterScreen,
        text: 'My New Pin',
      },
      attributes: {
        style: {
          primaryColor: '#badefe',
          accentColor: '#fefefe',
        },
      },
    };

    const page = await render(
      <vertex-viewer-pin-group
        data-is-dom-group-element={true}
        pin={pin}
        elementBounds={dimensions as DOMRect}
        projectionViewMatrix={viewMatrix}
        selected={false}
      ></vertex-viewer-pin-group>,
    );

    const el = page.root as HTMLVertexViewerPinGroupElement;

    const anchor = el.querySelector('#pin-anchor') as HTMLElement;
    const line = el.querySelector('vertex-viewer-pin-label-line line');
    const label = el.querySelector('vertex-viewer-pin-label');
    expect(anchor.style.background).toBe('#badefe');
    expect(line?.getAttribute('style')).toBe('stroke: #badefe;');
    const wrapper = label?.querySelector(
      '.pin-label-input-wrapper',
    ) as HTMLElement;
    expect(wrapper.style.borderColor).toBe('#badefe');
    expect(wrapper.style.background).toBe('#fefefe');
  });

  it('should render a simple pin', async () => {
    const worldPosition = Vector3.create();

    const viewMatrix = Matrix4.makeIdentity();
    const pinModel = new PinModel();

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin: IconPin = {
      type: 'icon',
      id: 'my-pin-id',
      worldPosition,
    };

    const page = await render(
      <vertex-viewer-pin-group
        data-is-dom-group-element={true}
        pin={pin}
        elementBounds={dimensions as DOMRect}
        pinModel={pinModel}
        projectionViewMatrix={viewMatrix}
        selected={false}
      ></vertex-viewer-pin-group>,
    );

    const el = page.root as HTMLVertexViewerPinGroupElement;

    const icon = el.querySelector('vertex-viewer-icon');
    expect(icon).toHaveClass('pin');
    expect(icon?.shadowRoot?.querySelector('svg')).not.toBeNull();
  });

  it('should render a simple pin with a primary color', async () => {
    const worldPosition = Vector3.create();

    const viewMatrix = Matrix4.makeIdentity();
    const pinModel = new PinModel();

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin: IconPin = {
      type: 'icon',
      id: 'my-pin-id',
      worldPosition,
      attributes: {
        style: {
          primaryColor: '#ff22ee',
        },
      },
    };

    const page = await render(
      <vertex-viewer-pin-group
        data-is-dom-group-element={true}
        pin={pin}
        elementBounds={dimensions as DOMRect}
        pinModel={pinModel}
        projectionViewMatrix={viewMatrix}
        selected={false}
      ></vertex-viewer-pin-group>,
    );

    const el = page.root as HTMLVertexViewerPinGroupElement;

    const icon = el.querySelector('vertex-viewer-icon');
    expect(icon).toHaveClass('pin');
    expect(icon?.style.color).toBe('#ff22ee');
  });

  it('should select the pin when selecting the line', async () => {
    const worldPosition = Vector3.create();

    const viewMatrix = Matrix4.makeIdentity();
    const pinModel = new PinModel();

    const mockFn = vi.fn();
    pinModel.onSelectionChange(mockFn);

    const relativePointCenterScreen = Point.create(0, 0);
    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition,
      label: {
        point: relativePointCenterScreen,
        text: 'My New Pin',
      },
    };

    const page = await render(
      <vertex-viewer-pin-group
        data-is-dom-group-element={true}
        pin={pin}
        elementBounds={dimensions as DOMRect}
        pinModel={pinModel}
        projectionViewMatrix={viewMatrix}
        selected={false}
      ></vertex-viewer-pin-group>,
    );

    const el = page.root as HTMLVertexViewerPinGroupElement;

    const line = el.querySelector(
      'vertex-viewer-pin-label-line',
    ) as HTMLVertexViewerPinLabelLineElement;

    line.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await page.waitForChanges();

    expect(mockFn).toHaveBeenCalled();
  });

  it('should select the pin when selecting the label', async () => {
    const worldPosition = Vector3.create();

    const viewMatrix = Matrix4.makeIdentity();
    const pinModel = new PinModel();

    const mockFn = vi.fn();
    pinModel.onSelectionChange(mockFn);

    const relativePointCenterScreen = Point.create(0, 0);
    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition,
      label: {
        point: relativePointCenterScreen,
        text: 'My New Pin',
      },
    };

    const page = await render(
      <vertex-viewer-pin-group
        data-is-dom-group-element={true}
        pin={pin}
        elementBounds={dimensions as DOMRect}
        pinModel={pinModel}
        projectionViewMatrix={viewMatrix}
        selected={false}
      ></vertex-viewer-pin-group>,
    );

    const el = page.root as HTMLVertexViewerPinGroupElement;

    const label = el.querySelector(
      'vertex-viewer-pin-label',
    ) as HTMLVertexViewerPinLabelElement;

    label.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await page.waitForChanges();

    expect(mockFn).toHaveBeenCalled();
  });
});

describe(getClosestCenterToPoint, () => {
  const dimensions = {
    width: 20,
    height: 20,
  };

  const boxPoint = Point.create(25, 25);

  it('should return the point to the top of the box', async () => {
    const rightAboveBox = Point.create(27, 9);

    const expectedTopPoint = {
      x: boxPoint.x + dimensions.width / 2,
      y: boxPoint.y,
    };
    expect(
      getClosestCenterToPoint(boxPoint, rightAboveBox, dimensions),
    ).toEqual(expectedTopPoint);
  });

  it('should return the point to the left of the box', async () => {
    const leftOfBox = Point.create(10, 25);

    const expectedPoint = {
      x: boxPoint.x,
      y: boxPoint.y + dimensions.height / 2,
    };
    expect(getClosestCenterToPoint(boxPoint, leftOfBox, dimensions)).toEqual(
      expectedPoint,
    );
  });

  it('should return the point to the bottom of the box', async () => {
    const belowBox = Point.create(30, 45);

    const expectedBottomPoint = {
      x: boxPoint.x + dimensions.width / 2,
      y: boxPoint.y + dimensions.height,
    };
    expect(getClosestCenterToPoint(boxPoint, belowBox, dimensions)).toEqual(
      expectedBottomPoint,
    );
  });

  it('should return the point to the right of the box', async () => {
    const rightOfBox = Point.create(50, 55);

    const expectedRightOfBox = {
      x: boxPoint.x + dimensions.width / 2,
      y: boxPoint.y + dimensions.height,
    };
    expect(getClosestCenterToPoint(boxPoint, rightOfBox, dimensions)).toEqual(
      expectedRightOfBox,
    );
  });
});
