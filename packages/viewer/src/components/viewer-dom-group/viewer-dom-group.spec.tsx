import { newSpecPage } from '@stencil/core/testing';
import { Euler, Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';
import { ViewerDomGroup } from './viewer-dom-group';

describe('vertex-viewer-dom-group', () => {
  it('sets position, rotation and scale properties on init', async () => {
    const page = await newSpecPage({
      components: [ViewerDomGroup],
      html: `
        <vertex-viewer-dom-group
          position="[1, 2, 3]"
          rotation="[2, 3, 4]"
          scale="[3, 4, 5]">
        </vertex-viewer-dom-group>`,
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
    const onPropertyChange = jest.fn();

    const page = await newSpecPage({
      components: [ViewerDomGroup],
      html: `<vertex-viewer-dom-group></vertex-viewer-dom-group>`,
    });

    const el = page.root as HTMLVertexViewerDomElementElement;
    el.addEventListener('propertyChange', onPropertyChange);

    const position = Vector3.create(1, 2, 3);
    const rotation = Euler.create({ x: 2, y: 3, z: 4 });
    const quat = Quaternion.create({ x: 1, y: 2, z: 3, w: 4 });
    const scale = Vector3.create(3, 4, 5);
    const matrix = Matrix4.makeTRS(position, quat, scale);

    el.setAttribute('position', '[1, 2, 3]');
    await page.waitForChanges();
    expect(el.position).toEqual(position);
    expect(onPropertyChange).toHaveBeenCalled();
    onPropertyChange.mockReset();

    el.setAttribute('rotation', '[2, 3, 4]');
    await page.waitForChanges();
    expect(el.rotation).toEqual(rotation);
    expect(onPropertyChange).toHaveBeenCalled();
    onPropertyChange.mockReset();

    el.setAttribute('quaternion', '[1, 2, 3, 4]');
    await page.waitForChanges();
    expect(el.quaternion).toEqual(quat);
    expect(onPropertyChange).toHaveBeenCalled();
    onPropertyChange.mockReset();

    el.setAttribute('scale', '[3, 4, 5]');
    await page.waitForChanges();
    expect(el.scale).toEqual(scale);
    expect(onPropertyChange).toHaveBeenCalled();
    onPropertyChange.mockReset();

    expect(el.matrix).toEqual(matrix);
  });

  it('updates quaternion when rotation changes', async () => {
    const onPropertyChange = jest.fn();

    const page = await newSpecPage({
      components: [ViewerDomGroup],
      html: `<vertex-viewer-dom-group></vertex-viewer-dom-group>`,
    });

    const el = page.root as HTMLVertexViewerDomElementElement;
    el.addEventListener('propertyChange', onPropertyChange);

    const rotation = Euler.create({ x: 2, y: 3, z: 4 });
    el.setAttribute('rotation', '[2, 3, 4]');
    await page.waitForChanges();
    expect(el.quaternion).toEqual(Quaternion.fromEuler(rotation));
    expect(onPropertyChange).toHaveBeenCalled();
  });
});
