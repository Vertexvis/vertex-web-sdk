// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { ViewerDomRenderer } from './viewer-dom-renderer';
import {
  BoundingBox,
  Dimensions,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import { ViewerDomElement } from '../viewer-dom-element/viewer-dom-element';
import { DepthBuffer, FramePerspectiveCamera } from '../../lib/types';
import { createDepthImageBytes } from '../../testing/fixtures';

import '../../testing/domMocks';

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
    Dimensions.create(100, 100),
    Rectangle.create(0, 0, 100, 100),
    1,
    createDepthImageBytes(100, 100, 0),
    Dimensions.create(100, 100)
  );

  beforeEach(() => jest.resetAllMocks());

  describe('2d draw mode', () => {
    it('positions children using matrix3d', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer drawMode="2d" camera={camera}>
            <vertex-viewer-dom-element></vertex-viewer-dom-element>
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
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer camera={camera} drawMode="3d">
            <vertex-viewer-dom-element></vertex-viewer-dom-element>
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

  describe('attribute parsing', () => {
    it('parses position as array', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer camera={camera} drawMode="3d">
            <vertex-viewer-dom-element position="[0, 0, 0]"></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('matrix3d');
    });

    it('parses euler rotation as array', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer camera={camera} drawMode="3d">
            <vertex-viewer-dom-element rotation="[0, 0, 0]"></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('matrix3d');
    });

    it('parses quaternion rotation as array', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer camera={camera} drawMode="3d">
            <vertex-viewer-dom-element rotation="[0, 0, 0, 1]"></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('matrix3d');
    });

    it('parses scale as array', async () => {
      const page = await newSpecPage({
        components: [ViewerDomRenderer, ViewerDomElement],
        template: () => (
          <vertex-viewer-dom-renderer camera={camera} drawMode="3d">
            <vertex-viewer-dom-element scale="[1, 1, 1]"></vertex-viewer-dom-element>
          </vertex-viewer-dom-renderer>
        ),
      });

      const el = page.root?.querySelector(
        'vertex-viewer-dom-element'
      ) as HTMLElement;
      expect(el.style.transform).toContain('matrix3d');
    });
  });
});
