import { Viewer } from '../viewer/viewer';
import { CameraTools } from '../viewer-toolbar-camera-tools/viewer-toolbar-camera-tools';
import { Group } from '../viewer-toolbar-group/viewer-toolbar-group';
import { RotateTool } from '../viewer-toolbar-rotate-tool/viewer-toolbar-rotate-tool';
import { PanTool } from '../viewer-toolbar-pan-tool/viewer-toolbar-pan-tool';
import { ZoomTool } from '../viewer-toolbar-zoom-tool/viewer-toolbar-zoom-tool';
import { newSpecPage } from '@stencil/core/testing';

describe('viewer-toolbar-camera-tools', () => {
  beforeAll(() => {
    /* eslint-disable */
    (global as any).MutationObserver = class {
      constructor(callback) {}
      disconnect() {}
      observe(element, init) {}
    };
    /* eslint-enable */
  });

  it('reacts to interaction model changes, and updates components', async () => {
    const page = await newSpecPage({
      components: [Viewer, CameraTools, Group, RotateTool, PanTool, ZoomTool],
      html: `
        <vertex-viewer id="viewer">
          <viewer-toolbar-camera-tools></viewer-toolbar-camera-tools>
        </vertex-viewer>
      `,
    });

    (page.doc.querySelector('viewer-toolbar-camera-tools') as any).viewer =
      page.root;

    await page.waitForChanges();

    expect(
      (page.doc.querySelector('viewer-toolbar-rotate-tool') as any).selected
    ).toBe(true);

    (page.doc.querySelector('viewer-toolbar-pan-tool') as any).dispatchEvent(
      new MouseEvent('click')
    );

    await page.waitForChanges();

    expect(
      (page.doc.querySelector('viewer-toolbar-rotate-tool') as any).selected
    ).toBe(false);
  });
});
