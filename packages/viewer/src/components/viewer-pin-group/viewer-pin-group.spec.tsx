// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { IconPin, PinModel, TextPin } from '../../lib/pins/model';
import { VertexPinLabel } from '../viewer-pin-label/viewer-pin-label';
import { VertexPinLabelLine } from '../viewer-pin-label-line/viewer-pin-label-line';
import { getClosestCenterToPoint } from './utils';
import { ViewerPinGroup } from './viewer-pin-group';

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

    const page = await newSpecPage({
      components: [ViewerPinGroup, VertexPinLabel, VertexPinLabelLine],
      template: () => (
        <vertex-viewer-pin-group
          data-is-dom-group-element={true}
          pin={pin}
          elementBounds={dimensions as DOMRect}
          projectionViewMatrix={viewMatrix}
          selected={false}
        ></vertex-viewer-pin-group>
      ),
    });

    const el = page.root as HTMLVertexViewerPinGroupElement;

    expect(el).toEqualHtml(`
      <vertex-viewer-pin-group data-is-dom-group-element>
        <vertex-viewer-dom-element data-testid="drawn-pin-my-pin-id">
          <div class="pin-anchor" id="pin-anchor"></div>
        </vertex-viewer-dom-element>
        <vertex-viewer-pin-label-line id="pin-label-line-my-pin-id">
          <svg class="svg">
            <line class="label-line" x1="50" x2="50" y1="50" y2="50"></line>
          </svg>
        </vertex-viewer-pin-label-line>
        <vertex-viewer-pin-label>
        <div class="pin-label-input-wrapper" style="top: 50px; left: 50px; min-width: var(--viewer-annotations-pin-label-min-width); max-width: min(var(--viewer-annotations-pin-label-max-width), calc(100px - 50px)); max-height: min(var(--viewer-annotations-pin-label-max-height), calc(100px - 50px));">
          <textarea class="pin-label-input pin-label-text readonly" disabled="" id="pin-label-input-my-pin-id" rows="1" value="My New Pin"></textarea><div class="pin-input-drag-target"></div>
        </div>
        <div class="pin-label-hidden pin-label-text" style="max-width: min(var(--viewer-annotations-pin-label-max-width), calc(100px - 50px)); max-height: min(var(--viewer-annotations-pin-label-max-height), calc(100px - 50px));">
          My New Pin
        </div>
        </vertex-viewer-pin-label>
      </vertex-viewer-pin-group>
    `);
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

    const page = await newSpecPage({
      components: [ViewerPinGroup, VertexPinLabel, VertexPinLabelLine],
      template: () => (
        <vertex-viewer-pin-group
          data-is-dom-group-element={true}
          pin={pin}
          elementBounds={dimensions as DOMRect}
          projectionViewMatrix={viewMatrix}
          selected={false}
        ></vertex-viewer-pin-group>
      ),
    });

    const el = page.root as HTMLVertexViewerPinGroupElement;

    expect(el).toEqualHtml(`
      <vertex-viewer-pin-group data-is-dom-group-element>
        <vertex-viewer-dom-element data-testid="drawn-pin-my-pin-id">
          <div class="pin-anchor" id="pin-anchor" style="background: #badefe;"></div>
        </vertex-viewer-dom-element>
        <vertex-viewer-pin-label-line id="pin-label-line-my-pin-id">
          <svg class="svg">
            <line class="label-line" x1="50" x2="50" y1="50" y2="50" style="stroke: #badefe;"></line>
          </svg>
        </vertex-viewer-pin-label-line>
        <vertex-viewer-pin-label>
        <div class="pin-label-input-wrapper" style="top: 50px; left: 50px; min-width: var(--viewer-annotations-pin-label-min-width); max-width: min(var(--viewer-annotations-pin-label-max-width), calc(100px - 50px)); max-height: min(var(--viewer-annotations-pin-label-max-height), calc(100px - 50px)); border-color: #badefe; background: #fefefe;">
          <textarea class="pin-label-input pin-label-text readonly" disabled="" id="pin-label-input-my-pin-id" rows="1" value="My New Pin"></textarea><div class="pin-input-drag-target"></div>
        </div>
        <div class="pin-label-hidden pin-label-text" style="max-width: min(var(--viewer-annotations-pin-label-max-width), calc(100px - 50px)); max-height: min(var(--viewer-annotations-pin-label-max-height), calc(100px - 50px));">
          My New Pin
        </div>
        </vertex-viewer-pin-label>
      </vertex-viewer-pin-group>
    `);
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

    const page = await newSpecPage({
      components: [ViewerPinGroup],
      template: () => (
        <vertex-viewer-pin-group
          data-is-dom-group-element={true}
          pin={pin}
          elementBounds={dimensions as DOMRect}
          pinModel={pinModel}
          projectionViewMatrix={viewMatrix}
          selected={false}
        ></vertex-viewer-pin-group>
      ),
    });

    const el = page.root as HTMLVertexViewerPinGroupElement;

    expect(el).toEqualHtml(`
      <vertex-viewer-pin-group data-is-dom-group-element>
        <vertex-viewer-dom-element data-testid="drawn-pin-my-pin-id">
          <vertex-viewer-icon class="pin" name="pin-fill" size="lg"></vertex-viewer-icon>
        </vertex-viewer-dom-element>
      </vertex-viewer-pin-group>
    `);
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

    const page = await newSpecPage({
      components: [ViewerPinGroup],
      template: () => (
        <vertex-viewer-pin-group
          data-is-dom-group-element={true}
          pin={pin}
          elementBounds={dimensions as DOMRect}
          pinModel={pinModel}
          projectionViewMatrix={viewMatrix}
          selected={false}
        ></vertex-viewer-pin-group>
      ),
    });

    const el = page.root as HTMLVertexViewerPinGroupElement;

    expect(el).toEqualHtml(`
      <vertex-viewer-pin-group data-is-dom-group-element>
        <vertex-viewer-dom-element data-testid="drawn-pin-my-pin-id">
          <vertex-viewer-icon class="pin" name="pin-fill" size="lg" style="color: #ff22ee;"></vertex-viewer-icon>
        </vertex-viewer-dom-element>
      </vertex-viewer-pin-group>
    `);
  });

  it('should select the pin when selecting the line', async () => {
    const worldPosition = Vector3.create();

    const viewMatrix = Matrix4.makeIdentity();
    const pinModel = new PinModel();

    const mockFn = jest.fn();
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

    const page = await newSpecPage({
      components: [ViewerPinGroup],
      template: () => (
        <vertex-viewer-pin-group
          data-is-dom-group-element={true}
          pin={pin}
          elementBounds={dimensions as DOMRect}
          pinModel={pinModel}
          projectionViewMatrix={viewMatrix}
          selected={false}
        ></vertex-viewer-pin-group>
      ),
    });

    const el = page.root as HTMLVertexViewerPinGroupElement;

    const line = el.querySelector(
      'vertex-viewer-pin-label-line'
    ) as HTMLVertexViewerPinLabelLineElement;

    line.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await page.waitForChanges();

    expect(mockFn).toHaveBeenCalled();
  });

  it('should select the pin when selecting the label', async () => {
    const worldPosition = Vector3.create();

    const viewMatrix = Matrix4.makeIdentity();
    const pinModel = new PinModel();

    const mockFn = jest.fn();
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

    const page = await newSpecPage({
      components: [ViewerPinGroup],
      template: () => (
        <vertex-viewer-pin-group
          data-is-dom-group-element={true}
          pin={pin}
          elementBounds={dimensions as DOMRect}
          pinModel={pinModel}
          projectionViewMatrix={viewMatrix}
          selected={false}
        ></vertex-viewer-pin-group>
      ),
    });

    const el = page.root as HTMLVertexViewerPinGroupElement;

    const label = el.querySelector(
      'vertex-viewer-pin-label'
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
      getClosestCenterToPoint(boxPoint, rightAboveBox, dimensions)
    ).toEqual(expectedTopPoint);
  });

  it('should return the point to the left of the box', async () => {
    const leftOfBox = Point.create(10, 25);

    const expectedPoint = {
      x: boxPoint.x,
      y: boxPoint.y + dimensions.height / 2,
    };
    expect(getClosestCenterToPoint(boxPoint, leftOfBox, dimensions)).toEqual(
      expectedPoint
    );
  });

  it('should return the point to the bottom of the box', async () => {
    const belowBox = Point.create(30, 45);

    const expectedBottomPoint = {
      x: boxPoint.x + dimensions.width / 2,
      y: boxPoint.y + dimensions.height,
    };
    expect(getClosestCenterToPoint(boxPoint, belowBox, dimensions)).toEqual(
      expectedBottomPoint
    );
  });

  it('should return the point to the right of the box', async () => {
    const rightofBox = Point.create(50, 55);

    const expectedRightOfBox = {
      x: boxPoint.x + dimensions.width / 2,
      y: boxPoint.y + dimensions.height,
    };
    expect(getClosestCenterToPoint(boxPoint, rightofBox, dimensions)).toEqual(
      expectedRightOfBox
    );
  });
});
