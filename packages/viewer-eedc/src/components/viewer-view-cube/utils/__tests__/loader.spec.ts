import { GLTFLoader, Model } from '../loader';
import { Scene } from 'zen-3d';

describe(GLTFLoader, () => {
  describe(GLTFLoader.prototype.load, () => {
    it('should resolve returned promise with model', async () => {
      const stub = new StubLoader();
      const loader = new GLTFLoader(stub);
      const model = loader.load('file');
      stub.loaded({ scene: new Scene() });
      expect((await model).scene).toBeDefined();
    });

    it('should reject returned promise with error', async () => {
      const stub = new StubLoader();
      const loader = new GLTFLoader(stub);
      const model = loader.load('file');
      stub.error('oops');
      expect(model).rejects.toEqual('oops');
    });
  });
});

class StubLoader {
  private onLoad: (data: Model) => void;
  private onProgress: () => void;
  private onError: (error: any) => void;

  public load(
    file: string,
    onLoad: (data: Model) => void,
    onProgress: () => void,
    onError: (error: any) => void
  ): void {
    this.onLoad = onLoad;
    this.onProgress = onProgress;
    this.onError = onError;
  }

  public loaded(model: Model): void {
    this.onLoad(model);
  }

  public error(error: any): void {
    this.onError(error);
  }
}
