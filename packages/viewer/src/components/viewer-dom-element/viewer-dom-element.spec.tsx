// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Euler, Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';

import { ViewerDomElement } from './viewer-dom-element';

describe('vertex-viewer-dom-element', () => {
  it('sets position, rotation and scale properties on init', async () => {
    const page = await newSpecPage({
      components: [ViewerDomElement],
      html: `
        <vertex-viewer-dom-element
          position="[1, 2, 3]"
          rotation="[2, 3, 4]"
          scale="[3, 4, 5]">
        </vertex-viewer-dom-element>`,
    });

    const el = page.root as HTMLVertexViewerDomElementElement;

    const position = Vector3.create(1, 2, 3);
    const rotation = Euler.create({ x: 2, y: 3, z: 4 });
    const quat = Quaternion.fromEuler(rotation);
    const scale = Vector3.create(3, 4, 5);
    const matrix = Matrix4.makeTRS(position, quat, scale);

    expect(el.position).toEqual(position);
    expect(el.rotation).toEqual(rotation);
    expect(el.quaternion).toEqual(quat);
    expect(el.scale).toEqual(scale);
    expect(el.matrix).toEqual(matrix);
  });

  it('syncs properties when json attributes change', async () => {
    const page = await newSpecPage({
      components: [ViewerDomElement],
      html: `<vertex-viewer-dom-element></vertex-viewer-dom-element>`,
    });

    const el = page.root as HTMLVertexViewerDomElementElement;

    const position = Vector3.create(1, 2, 3);
    const rotation = Euler.create({ x: 2, y: 3, z: 4 });
    const quat = Quaternion.create({ x: 1, y: 2, z: 3, w: 4 });
    const scale = Vector3.create(3, 4, 5);
    const matrix = Matrix4.makeTRS(position, quat, scale);

    el.setAttribute('position', '[1, 2, 3]');
    await page.waitForChanges();
    expect(el.position).toEqual(position);

    el.setAttribute('rotation', '[2, 3, 4]');
    await page.waitForChanges();
    expect(el.rotation).toEqual(rotation);

    el.setAttribute('quaternion', '[1, 2, 3, 4]');
    await page.waitForChanges();
    expect(el.quaternion).toEqual(quat);

    el.setAttribute('scale', '[3, 4, 5]');
    await page.waitForChanges();
    expect(el.scale).toEqual(scale);

    expect(el.matrix).toEqual(matrix);
  });

  it('updates quaternion when rotation changes', async () => {
    const page = await newSpecPage({
      components: [ViewerDomElement],
      html: `<vertex-viewer-dom-element></vertex-viewer-dom-element>`,
    });

    const el = page.root as HTMLVertexViewerDomElementElement;

    const rotation = Euler.create({ x: 2, y: 3, z: 4 });
    el.setAttribute('rotation', '[2, 3, 4]');
    await page.waitForChanges();
    expect(el.quaternion).toEqual(Quaternion.fromEuler(rotation));
  });

  it('sets occluded attribute if occluded', async () => {
    const page = await newSpecPage({
      components: [ViewerDomElement],
      html: `<vertex-viewer-dom-element></vertex-viewer-dom-element>`,
    });

    const el = page.root as HTMLVertexViewerDomElementElement;
    el.occluded = true;

    await page.waitForChanges();
    expect(el).toHaveAttribute('occluded');
  });
});
