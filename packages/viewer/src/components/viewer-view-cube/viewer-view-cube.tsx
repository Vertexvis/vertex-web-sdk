import {
  Component,
  Element,
  getAssetPath,
  Host,
  h,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { EedcFrameAttributes } from '../../image-streaming-client';
import { Vector3, Point } from '@vertexvis/geometry';
import { Camera } from '@vertexvis/graphics3d';
import { ViewCubeRenderer } from './utils/viewCubeRenderer';

@Component({
  tag: 'vertex-viewer-view-cube',
  styleUrl: 'viewer-view-cube.css',
  shadow: true,
  assetsDirs: ['assets'],
})
export class ViewerViewCube {
  /**
   * @private
   */
  @Prop() public viewer?: HTMLVertexViewerElement;

  @State() private bounds?: DOMRect;

  @Element() private hostElement!: HTMLElement;

  private canvasElement!: HTMLCanvasElement;
  private viewCube = new ViewCubeRenderer(
    getAssetPath('./assets/viewcube.glb')
  );

  private mousePosition?: Point.Point;

  private isResizing?: boolean;

  public constructor() {
    this.handleFrameChanged = this.handleFrameChanged.bind(this);
    this.handleWindowMouseMove = this.handleWindowMouseMove.bind(this);
    this.handleWindowMouseDown = this.handleWindowMouseDown.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  public componentDidLoad(): void {
    this.viewCube.load(this.canvasElement).then(() => this.render());

    this.setCanvasDimensions();
    this.resize();
    this.handleViewerChanged(this.viewer, this.viewer);

    window.addEventListener('mousedown', this.handleWindowMouseDown);
    window.addEventListener('mousemove', this.handleWindowMouseMove);
    window.addEventListener('resize', this.handleWindowResize);
  }

  public componentDidUnload(): void {
    window.removeEventListener('mousedown', this.handleWindowMouseDown);
    window.removeEventListener('mousemove', this.handleWindowMouseMove);
    window.removeEventListener('resize', this.handleWindowResize);
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <canvas
          ref={ref => (this.canvasElement = ref)}
          class="canvas"
          width={this.bounds?.width}
          height={this.bounds?.height}
        ></canvas>
      </Host>
    );
  }

  @Watch('viewer')
  public async handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): Promise<void> {
    if (oldViewer != null) {
      this.viewCube.hide();
      oldViewer.removeEventListener('frameReceived', this.handleFrameChanged);
    }

    if (newViewer != null) {
      newViewer.addEventListener('frameReceived', this.handleFrameChanged);

      const frame = await newViewer.getFrameAttributes();
      if (frame != null) {
        this.viewCube.show();
        this.updateWebGlCamera(frame.scene.camera);
      }
    }
  }

  private handleFrameChanged(event: CustomEvent<EedcFrameAttributes>): void {
    const { camera } = event.detail.scene;
    this.viewCube.show();
    this.updateWebGlCamera(camera);
  }

  private updateWebGlCamera(camera: Camera.Camera): void {
    this.viewCube.positionCamera(camera);
    this.renderWebGl();
  }

  private handleWindowMouseDown(event: MouseEvent): void {
    const position = Point.create(event.clientX, event.clientY);
    const point = this.getWorldSpacePosition(position);
    const camera = this.viewCube.getHitToCamera(point);

    if (camera != null) {
      this.updateCamera(camera);
    }
  }

  private handleWindowMouseMove(event: MouseEvent): void {
    this.mousePosition = Point.create(event.clientX, event.clientY);
    this.renderWebGl();
  }

  private handleWindowResize(event: UIEvent): void {
    if (!this.isResizing) {
      this.isResizing = true;

      window.requestAnimationFrame(() => {
        this.setCanvasDimensions();
        this.resize();
        this.isResizing = false;
      });
    }
  }

  private renderWebGl(): void {
    requestAnimationFrame(() => {
      if (this.mousePosition != null) {
        const point = this.getWorldSpacePosition(this.mousePosition);
        const hit = this.viewCube.highlight(point);

        this.togglePointerEvents(hit);
      }

      this.viewCube.render();
    });
  }

  private resize(): void {
    if (this.bounds != null) {
      const { width, height } = this.bounds;
      this.viewCube.resize(width, height);
      this.renderWebGl();
    }
  }

  private setCanvasDimensions(): void {
    this.bounds = this.hostElement.getBoundingClientRect();
  }

  private togglePointerEvents(enabled: boolean): void {
    this.hostElement.style.pointerEvents = enabled ? 'inherit' : 'none';
  }

  private getWorldSpacePosition(
    mousePosition: Point.Point
  ): Point.Point | undefined {
    if (this.bounds != null) {
      const elementPosition = Point.create(this.bounds.left, this.bounds.top);
      const localMousePosition = Point.subtract(mousePosition, elementPosition);
      return Point.create(
        (localMousePosition.x / this.bounds.width) * 2 - 1,
        -(localMousePosition.y / this.bounds.height) * 2 + 1
      );
    }
  }

  private async updateCamera(
    data: Pick<Camera.Camera, 'position' | 'upvector'>
  ): Promise<void> {
    if (this.viewer != null) {
      const scene = await this.viewer.scene();
      scene
        .camera()
        .set({ ...data, lookat: Vector3.origin() })
        .viewAll()
        .execute({ animate: true });
    }
  }
}
