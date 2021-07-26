import { Scene, DirectionalLight, Object3D } from 'three';
import { FramePerspectiveCamera } from '../types';

export class VertexScene extends Scene {
  private light: DirectionalLight = new DirectionalLight(0xffffff, 0.9);
  private lightTarget: Object3D = new Object3D();

  public constructor() {
    super();

    this.add(this.light);
    this.add(this.lightTarget);
  }

  public updateLighting(camera: FramePerspectiveCamera): void {
    const { position, lookAt } = camera;

    this.lightTarget.position.set(lookAt.x, lookAt.y, lookAt.z);
    this.light.position.set(position.x, position.y, position.z);
  }
}
