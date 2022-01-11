// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import {
  BoundingBox,
  Dimensions,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';

import { DepthBuffer, FramePerspectiveCamera } from '../../lib/types';
import { makeDepthImageBytes } from '../../testing/fixtures';
import { ViewerDomElement } from '../viewer-dom-element/viewer-dom-element';
import { ViewerDomGroup } from '../viewer-dom-group/viewer-dom-group';
import { ViewerDomRenderer } from './viewer-dom-renderer';

describe('<vertex-viewer-dom-renderer>', () => {
  const camera = FramePerspectiveCamera.fromBoundingBox(
    {
      position: { x: 0, y: 0, z: -100 },
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    BoundingBox.create({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 }),
    1
  );
  const depthBuffer = new DepthBuffer(
    camera,
    {
      frameDimensions: Dimensions.create(100, 100),
      imageRect: Rectangle.create(0, 0, 100, 100),
      imageScale: 1,
    },
    makeDepthImageBytes(100, 100, 0)
  );

  beforeEach(() => jest.resetAllMocks());

  describe('2d draw mode', () => {
    it('positions children using matrix3d', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomGroup, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer drawMode="2d" camera={camera}>
            <vertex-viewer-dom-group>
              <vertex-viewer-dom-element />
            </vertex-viewer-dom-group>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('translate(-50%, -50%)');
    });

    it('unsets occluded attribute if element no occluded', async () => {
      const isOccluded = jest.spyOn(depthBuffer, 'isOccluded');
      isOccluded.mockReturnValue(false);

      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer
            drawMode="2d"
            camera={camera}
            depthBuffer={depthBuffer}
          >
            <vertex-viewer-dom-element></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.getAttribute('occluded')).toBeNull();
    });

    it('sets occluded attribute if element is occluded', async () => {
      const isOccluded = jest.spyOn(depthBuffer, 'isOccluded');
      isOccluded.mockReturnValue(true);

      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer
            drawMode="2d"
            camera={camera}
            depthBuffer={depthBuffer}
          >
            <vertex-viewer-dom-element></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.getAttribute('occluded')).toBe('');
    });

    it('does not set occluded if element has occlusion disabled', async () => {
      const isOccluded = jest.spyOn(depthBuffer, 'isOccluded');
      isOccluded.mockReturnValue(true);

      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer
            drawMode="2d"
            camera={camera}
            depthBuffer={depthBuffer}
          >
            <vertex-viewer-dom-element occlusionOff></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.getAttribute('occluded')).toBeNull();
    });
  });

  describe('3d draw mode', () => {
    it('positions children using matrix3d', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomGroup, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer camera={camera} drawMode="3d">
            <vertex-viewer-dom-group>
              <vertex-viewer-dom-element />
            </vertex-viewer-dom-group>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('translate(-50%, -50%)');
      expect(el.style.transform).toContain('matrix3d');
    });

    it('rotates element when bill boarding is off', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer camera={camera} drawMode="3d">
            <vertex-viewer-dom-element billboardOff></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('translate(-50%, -50%)');
      expect(el.style.transform).toContain('matrix3d');
    });
  });

  describe('occlusion', () => {
    it('unsets occluded attribute if element no occluded', async () => {
      const isOccluded = jest.spyOn(depthBuffer, 'isOccluded');
      isOccluded.mockReturnValue(false);

      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer
            drawMode="3d"
            camera={camera}
            depthBuffer={depthBuffer}
          >
            <vertex-viewer-dom-element></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.getAttribute('occluded')).toBeNull();
    });

    it('sets occluded attribute if element is occluded', async () => {
      const isOccluded = jest.spyOn(depthBuffer, 'isOccluded');
      isOccluded.mockReturnValue(true);

      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer
            drawMode="3d"
            camera={camera}
            depthBuffer={depthBuffer}
          >
            <vertex-viewer-dom-element></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.getAttribute('occluded')).toBe('');
    });

    it('does not set occluded if element occlusion disabled', async () => {
      const isOccluded = jest.spyOn(depthBuffer, 'isOccluded');
      isOccluded.mockReturnValue(true);

      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer
            drawMode="3d"
            camera={camera}
            depthBuffer={depthBuffer}
          >
            <vertex-viewer-dom-element occlusionOff></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.getAttribute('occluded')).toBeNull();
    });
  });
});
