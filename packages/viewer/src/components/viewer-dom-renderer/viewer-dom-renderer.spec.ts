import { newSpecPage } from '@stencil/core/testing';
import { ViewerDomRenderer } from './viewer-dom-renderer';
import { ViewerDomElement } from '../viewer-dom-element/viewer-dom-element';

import '../../testing/domMocks';

describe('<vertex-viewer-dom-renderer>', () => {
  describe('2d draw mode', () => {
    it('positions children using matrix3d', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        html: `
        <vertex-viewer-dom-renderer draw-mode="2d">
          <vertex-viewer-dom-element></vertex-viewer-dom-element>
        </vertex-viewer-dom-renderer>
        `,
      });

      const el = page.root.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('translate(-50%, -50%)');
    });
  });

  describe('3d draw mode', () => {
    it('positions children using matrix3d', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        html: `
        <vertex-viewer-dom-renderer draw-mode="3d">
          <vertex-viewer-dom-element></vertex-viewer-dom-element>
        </vertex-viewer-dom-renderer>
        `,
      });

      const el = page.root.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('translate(-50%, -50%)');
      expect(el.style.transform).toContain('matrix3d');
    });

    it('rotates element when bill boarding is off', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        html: `
        <vertex-viewer-dom-renderer draw-mode="3d">
          <vertex-viewer-dom-element billboard-off></vertex-viewer-dom-element>
        </vertex-viewer-dom-renderer>
        `,
      });

      const el = page.root.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('translate(-50%, -50%)');
      expect(el.style.transform).toContain('matrix3d');
    });
  });

  describe('attribute parsing', () => {
    it('parses position as array', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        html: `
        <vertex-viewer-dom-renderer draw-mode="3d">
          <vertex-viewer-dom-element position="[0, 0, 0]"></vertex-viewer-dom-element>
        </vertex-viewer-dom-renderer>
        `,
      });

      const el = page.root.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('matrix3d');
    });

    it('parses euler rotation as array', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        html: `
        <vertex-viewer-dom-renderer draw-mode="3d">
          <vertex-viewer-dom-element rotation="[0, 0, 0]"></vertex-viewer-dom-element>
        </vertex-viewer-dom-renderer>
        `,
      });

      const el = page.root.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('matrix3d');
    });

    it('parses quaternion rotation as array', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        html: `
        <vertex-viewer-dom-renderer draw-mode="3d">
          <vertex-viewer-dom-element rotation="[0, 0, 0, 1]"></vertex-viewer-dom-element>
        </vertex-viewer-dom-renderer>
        `,
      });

      const el = page.root.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('matrix3d');
    });

    it('parses scale as array', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        html: `
        <vertex-viewer-dom-renderer draw-mode="3d">
          <vertex-viewer-dom-element scale="[1, 1, 1]"></vertex-viewer-dom-element>
        </vertex-viewer-dom-renderer>
        `,
      });

      const el = page.root.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('matrix3d');
    });
  });
});
