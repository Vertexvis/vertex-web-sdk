import '../../testing/domMocks';

import { newSpecPage } from '@stencil/core/testing';
import { Viewer } from '../viewer/viewer';
import { SceneTree } from './scene-tree';

describe('<vertex-scene-tree />', () => {
  it('queries for the viewer', async () => {
    const page = await newSpecPage({
      components: [SceneTree, Viewer],
      html: `
        <vertex-scene-tree viewer-selector="#viewer"></vertex-scene-tree>
        <vertex-viewer id="viewer"></vertex-viewer>
      `,
    });

    const sceneTree = page.body.querySelector(
      'vertex-scene-tree'
    ) as HTMLVertexSceneTreeElement;

    expect(sceneTree.viewer).toBeDefined();
  });
});
