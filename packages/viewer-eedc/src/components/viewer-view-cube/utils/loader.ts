import { Scene } from 'zen-3d';
import { GLTFLoader as ZenGLTFLoader } from 'zen-3d-addons';

export interface Model {
  scene: Scene;
}

export interface Loader {
  load(file: string): Promise<Model>;
}

export class GLTFLoader implements Loader {
  public constructor(private loader = new ZenGLTFLoader()) {}

  public load(file: string): Promise<Model> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        file,
        model => resolve(model),
        () => undefined,
        error => reject(error)
      );
    });
  }
}
