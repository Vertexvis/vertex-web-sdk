// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { TextPin } from '../../lib/pins/model';
import { viewer } from '../viewer/__mocks__/mocks';
import { ViewerPinGroup } from '../viewer-pin-group/viewer-pin-group';
import { ViewerPinTool } from './viewer-pin-tool';

describe('vertex-viewer-pin-tool', () => {
  it('should render a label for a pin and support dragging the label', async () => {
    const pin: TextPin = {
      type: 'text',
      id: 'my-pin-id',
      worldPosition: Vector3.create(),
      label: {
        point: Point.create(0, 0),
        text: 'My New Pin',
      },
    };
    const addEventListener = jest.fn();

    const page = await newSpecPage({
      components: [ViewerPinTool, ViewerPinGroup],
      template: () => (
        <vertex-viewer-pin-tool
          id="vertex-viewer-pin-tool"
          mode="edit"
          tool="pin-text"
        ></vertex-viewer-pin-tool>
      ),
    });
    const toolEl = page.root as HTMLVertexViewerPinToolElement;
    toolEl.viewer = {
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
    toolEl.pinController?.addPin(pin);

    await page.waitForChanges();

    expect(addEventListener).toHaveBeenCalledWith(
      'frameDrawn',
      expect.any(Function)
    );

    expect(toolEl.shadowRoot).toEqualHtml(`
      <vertex-viewer-dom-renderer drawmode="2d">
        <vertex-viewer-pin-group data-is-dom-group-element id="pin-group-my-pin-id">
          <vertex-viewer-dom-element data-testid="drawn-pin-my-pin-id">
            <div class="pin-anchor" id="pin-anchor"></div>
          </vertex-viewer-dom-element>
          <vertex-viewer-pin-label-line id="pin-label-line-my-pin-id"></vertex-viewer-pin-label-line>
          <vertex-viewer-pin-label></vertex-viewer-pin-label>
        </vertex-viewer-pin-group>
      </vertex-viewer-dom-renderer>
    `);
  });
});
