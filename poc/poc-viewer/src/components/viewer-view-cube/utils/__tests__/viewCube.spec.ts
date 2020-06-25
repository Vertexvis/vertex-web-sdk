import { ViewCube } from '../viewCube';
import { Loader, Model } from '../loader';
import { BasicMaterial, Camera, CubeGeometry, Mesh, Scene } from 'zen-3d';
import { Point } from '@vertexvis/geometry';

describe(ViewCube, () => {
  describe(ViewCube.prototype.load, () => {
    it('should load a gltf cube', async () => {
      const { scene, camera, viewCube } = createTestData();
      await viewCube.load(new StubLoader());

      const hit = viewCube.getHitToCamera(Point.create(0, 0), scene, camera);
      expect(hit).toBeDefined();
    });
  });

  function createTestData(): {
    scene: Scene;
    camera: Camera;
    viewCube: ViewCube;
  } {
    const scene = new Scene();
    const camera = new Camera();
    camera.position.set(0, 0, -2);
    const viewCube = new ViewCube('cube.glb');
    scene.add(viewCube);

    return { scene, camera, viewCube };
  }
});

class StubLoader implements Loader {
  public async load(file: string): Promise<Model> {
    const cube = new CubeGeometry();
    const mesh = new Mesh(cube, new BasicMaterial());
    mesh.name = 'cube';
    const scene = new Scene();
    scene.add(mesh);
    return { scene };
  }
}
