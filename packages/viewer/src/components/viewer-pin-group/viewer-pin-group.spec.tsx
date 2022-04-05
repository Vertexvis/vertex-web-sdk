// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { DefaultPin, TextPin } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import { VertexPinLabel } from '../viewer-pin-label/viewer-pin-label';
import { VertexPinLabelLine } from '../viewer-pin-label-line/vertex-pin-label-line';
import { getClosestCenterToPoint } from './utils';
import { ViewerPinGroup } from './viewer-pin-group';

describe('vertex-view-pin-group', () => {
  it('should render a text pin', async () => {
    const hitPoint = Point.create(75, 10);

    const worldPosition = Vector3.create();

    const viewMatrix = Matrix4.makeIdentity();
    const pinModel = new PinModel();

    const relativePointCenterScreen = Point.create(0, 0);
    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin = new TextPin('my-pin-id', worldPosition, hitPoint, {
      labelPoint: relativePointCenterScreen,
      labelText: 'My New Pin',
    });

    const page = await newSpecPage({
      components: [ViewerPinGroup, VertexPinLabel, VertexPinLabelLine],
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

    const el = page.root as HTMLVertexViewerPinLabelLineElement;

    const pinGroup = el.querySelector(`#pin-group-${pin.id}`);
    expect(pinGroup).toEqualHtml(`
      <vertex-viewer-dom-group data-testid="pin-group-my-pin-id" id="pin-group-my-pin-id">
        <vertex-viewer-dom-element data-testid="drawn-pin-my-pin-id">
          <div class="pin-anchor" id="pin-anchor"></div>
        </vertex-viewer-dom-element>
        <vertex-viewer-pin-label-line id="pin-label-line-my-pin-id">
          <svg class="svg">
            <g>
              <line class="label-line" x1="50" x2="50" y1="50" y2="50"></line>
            </g>
          </svg>
        </vertex-viewer-pin-label-line>
        <vertex-viewer-pin-label>
          <div class="pin-label" id="pin-label-my-pin-id" style="top: 50px; left: 50px;">
            My New Pin
          </div>
        </vertex-viewer-pin-label>
      </vertex-viewer-dom-group>
    `);

    await page.waitForChanges();
  });

  it('should render a default pin', async () => {
    const hitPoint = Point.create(75, 10);

    const worldPosition = Vector3.create();

    const viewMatrix = Matrix4.makeIdentity();
    const pinModel = new PinModel();

    const dimensions: Dimensions.Dimensions = { height: 100, width: 100 };
    const pin = new DefaultPin('my-pin-id', worldPosition, hitPoint);

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

    const el = page.root as HTMLVertexViewerPinLabelLineElement;

    const pinGroup = el.querySelector(`#pin-group-${pin.id}`);
    expect(pinGroup).toEqualHtml(`
      <vertex-viewer-dom-group data-testid="pin-group-my-pin-id" id="pin-group-my-pin-id">
        <vertex-viewer-dom-element data-testid="drawn-pin-my-pin-id">
          <vertex-viewer-icon class="pin" name="pin-fill" size="lg"></vertex-viewer-icon>
        </vertex-viewer-dom-element>
      </vertex-viewer-dom-group>
    `);
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
