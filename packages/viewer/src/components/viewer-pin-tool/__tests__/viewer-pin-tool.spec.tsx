// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { TextPin } from '../../../lib/pins/model';
import { viewer } from '../../viewer/__mocks__/mocks';
import { ViewerPinGroup } from '../../viewer-pin-group/viewer-pin-group';
import { ViewerPinTool } from '../viewer-pin-tool';

describe('vertex-viewer-pin-tool', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render a label for a pin and support dragging the label', async () => {
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

  it('should setup the projectionViewMatrix when loading with an initialized viewer', async () => {
    /* eslint-disable prettier/prettier */
    const matrix = [
      0, 0.5, 0.5, 0,
      0, 1, 0, 0,
      0.5, 0.5, 0, 0,
      0, 0, 0, 1
    ];
    /* eslint-enable prettier/prettier */

    const page = await newSpecPage({
      components: [ViewerPinTool, ViewerPinGroup],
      template: () => (
        <vertex-viewer-pin-tool
          id="vertex-viewer-pin-tool"
          mode="edit"
          tool="pin-text"
          viewer={
            {
              ...viewer,
              addEventListener,
              frame: {
                scene: {
                  camera: {
                    projectionViewMatrix: matrix,
                  },
                },
              },
            } as unknown as HTMLVertexViewerElement
          }
        ></vertex-viewer-pin-tool>
      ),
    });
    const toolEl = page.root as HTMLVertexViewerPinToolElement;

    toolEl.pinController?.addPin(pin);

    await page.waitForChanges();

    expect(addEventListener).toHaveBeenCalledWith(
      'frameDrawn',
      expect.any(Function)
    );

    expect(
      toolEl.shadowRoot?.querySelector('vertex-viewer-pin-group')
        ?.projectionViewMatrix
    ).toMatchObject(matrix);
  });

  it('sets the depth buffers value depending if there are pins rendered', async () => {
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
      addEventListener: jest.fn(),
      frame: {
        scene: {
          camera: {
            projectionViewMatrix: Matrix4.makeIdentity(),
          },
        },
      },
      rotateAroundTapPoint: false,
    } as unknown as HTMLVertexViewerElement;

    expect(toolEl.viewer.depthBuffers).toEqual(undefined);

    // Set depthBuffers to 'final' when there are pins
    toolEl.pinController?.addPin(pin);

    await page.waitForChanges();

    expect(toolEl.viewer.rotateAroundTapPoint).toEqual(false);
    expect(toolEl.viewer.depthBuffers).toMatch('final');

    // Remove depthBuffers override when there are no pins
    toolEl.pinController?.clearPins();

    await page.waitForChanges();

    expect(toolEl.viewer.depthBuffers).toEqual(undefined);
  });
});
