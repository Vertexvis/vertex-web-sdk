import {
  AmbientLight,
  Camera as ZenCamera,
  DirectionalLight,
  Renderer,
  Scene as ZenScene,
  Vector3 as ZenVector3,
} from 'zen-3d';
import { ViewCube } from './viewCube';
import { Angle, Vector3, Point } from '@vertexvis/geometry';
import { Camera } from '@vertexvis/graphics3d';

export class ViewCubeRenderer {
  public readonly scene: ZenScene;
  public readonly camera: ZenCamera;

  private renderer: Renderer;
  private viewCube: ViewCube;
  private isVisible = false;

  public constructor(assetPath: string) {
    this.viewCube = new ViewCube(assetPath);
    this.scene = new ZenScene();

    this.camera = new ZenCamera();
    this.scene.add(this.camera);

    this.addLighting();
  }

  public load(canvasElement: HTMLCanvasElement): Promise<void> {
    this.renderer = new Renderer(canvasElement, {
      antialias: true,
      alpha: true,
    });

    this.renderer.glCore.state.colorBuffer.setClear(0, 0, 0, 0);
    this.renderer.glCore.clear(true, true, true);

    return this.viewCube.load();
  }

  public hide(): void {
    if (this.isVisible) {
      this.scene.remove(this.viewCube);
      this.isVisible = false;
    }
  }

  public getHitToCamera(
    point: Point.Point
  ): Pick<Camera.Camera, 'position' | 'upvector'> | undefined {
    return this.viewCube.getHitToCamera(point, this.scene, this.camera);
  }

  public highlight(point: Point.Point): boolean {
    return this.viewCube.highlight(point, this.scene, this.camera) != null;
  }

  public positionCamera({ position, lookat, upvector }: Camera.Camera): void {
    const newPosition = Vector3.scale(
      6,
      Vector3.normalize(Vector3.subtract(position, lookat))
    );

    this.camera.position.set(newPosition.x, newPosition.y, newPosition.z);
    this.camera.lookAt(
      new ZenVector3(0, 0, 0),
      new ZenVector3(upvector.x, upvector.y, upvector.z)
    );
  }

  public show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.scene.add(this.viewCube);
    }
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number): void {
    this.camera.setPerspective(Angle.toRadians(45), width / height, 1, 1000);
    this.renderer.backRenderTarget.resize(width, height);
  }

  private addLighting(): void {
    const ambientLight = new AmbientLight(0xffffff);
    ambientLight.intensity = 2;

    const directionalLight = new DirectionalLight();
    directionalLight.color.setHex(0xffffff);
    directionalLight.position.set(0.5, 0, 0.866); // ~60º
    directionalLight.intensity = 2.5;
    directionalLight.lookAt(new ZenVector3(), new ZenVector3(0, 1, 0));

    this.camera.add(ambientLight);
    this.camera.add(directionalLight);
  }
}
