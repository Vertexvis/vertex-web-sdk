import * as Scene from '../scene';
import * as Camera from '../camera';
import { Dimensions } from '@vertexvis/geometry';

describe(Scene.create, () => {
  it('creates scene with correct aspect ratio', () => {
    const camera = Camera.create();
    const viewport = Dimensions.create(200, 100);
    const scene = Scene.create(camera, viewport);
    expect(scene.camera.aspect).toEqual(2);
  });
});
