// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { PinController } from '../../lib/pins/controller';
import { TextPin } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import { viewer } from '../viewer/__mocks__/mocks';
import { ViewerPinGroup } from '../viewer-pin-group/vertex-pin-group';
import { ViewerPinTool } from './viewer-pin-tool';
describe('vertex-viewer-pin-tool', () => {
  it('should render a label for a pin and support draging the label', async () => {
    const hitPoint = Point.create(100, 0);

    const worldPosition = Vector3.create();

    const pinModel = new PinModel();
    const pinController = new PinController(pinModel, 'edit', 'pin-label');

    const relativePointCenterScreen = Point.create(0, 0);
    const pin = new TextPin('my-pin-id', worldPosition, hitPoint, {
      labelPoint: relativePointCenterScreen,
      labelText: 'My New Pin',
    });
    const page = await newSpecPage({
      components: [ViewerPinTool, ViewerPinGroup],
      template: () => (
        <vertex-viewer-pin-tool
          id="vertex-viewer-pin-tool"
          mode="edit"
          tool="pin-label"
          pins={[pin]}
        ></vertex-viewer-pin-tool>
      ),
    });

    const addEventListener = jest.fn();
    page.rootInstance.viewer = {
      ...viewer,
      addEventListener,
      frame: {
        scene: {
          camera: {
            projectionViewMatrix: Matrix4.makeIdentity(),
          },
        },
      },
    } as unknown as HTMLVertexViewerElement;

    pinController.addEntity(pin);

    await page.waitForChanges();

    expect(addEventListener).toHaveBeenCalledWith(
      'frameDrawn',
      expect.any(Function)
    );

    const pinTool = page.root as HTMLVertexViewerPinToolElement;

    expect(pinTool.shadowRoot).toEqualHtml(`
      <vertex-viewer-dom-renderer drawmode="2d">
        <vertex-viewer-pin-group data-is-dom-group-element>
          <vertex-viewer-dom-group data-testid="pin-group-my-pin-id" id="pin-group-my-pin-id">
            <vertex-viewer-dom-element data-testid="drawn-pin-my-pin-id">
              <div class="pin-anchor" id="pin-anchor"></div>
            </vertex-viewer-dom-element>
            <vertex-viewer-pin-label-line id="pin-label-line-my-pin-id"></vertex-viewer-pin-label-line>
            <vertex-viewer-pin-label></vertex-viewer-pin-label>
          </vertex-viewer-dom-group>
        </vertex-viewer-pin-group>
      </vertex-viewer-dom-renderer>
    `);
  });
});
