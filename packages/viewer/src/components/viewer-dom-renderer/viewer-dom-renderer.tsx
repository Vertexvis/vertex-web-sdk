import {
  Component,
  Element,
  h,
  Host,
  Listen,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { Matrix4 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { MultiElementInteractionHandler } from '../../lib/interactions/multiElementInteractionHandler';
import { DepthBuffer, Viewport } from '../../lib/types';
import { FrameCameraBase } from '../../lib/types/frame';
import { Renderer2d, update2d } from './renderer2d';
import { Renderer3d, update3d } from './renderer3d';

export type ViewerDomRendererDrawMode = '2d' | '3d';

/**
 * The `ViewerDomRenderer` is responsible for managing a
 * `<vertex-viewer-dom-renderer>` element. This element supports drawing DOM
 * objects in a local 3D scene that is synced with a remote rendered scene.
 */
@Component({
  tag: 'vertex-viewer-dom-renderer',
  styleUrl: 'viewer-dom-renderer.css',
  shadow: false,
  scoped: true,
})
export class ViewerDomRenderer {
  /**
   * Specifies the drawing mode for the renderer.
   *
   * When in `3d` mode, elements are positioned using CSS 3D transforms and will
   * scale and rotate with the camera. In `2d` mode, a simpler 2D transform is
   * used, and elements will not scale or rotate with camera changes.
   */
  @Prop()
  public drawMode: ViewerDomRendererDrawMode = '3d';

  /**
   * Specifies whether to propagate events to the viewer's interaction handlers
   *
   * When `true` any viewer change will result in registering the host element of the dom
   * renderer as a listenable element to the viewers interaction handlers.
   * When false, no events will propogate to the viewer.
   */
  @Prop()
  public propagateEventsToViewer = true;

  /**
   * The viewer synced to this renderer. This property will automatically be
   * assigned if the renderer is a child of `<vertex-viewer>`.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The current camera of the frame.
   *
   * This property will automatically be set when supplying a viewer to the
   * component, or when added as a child to `<vertex-viewer>`.
   */
  @Prop({ mutable: true })
  public camera?: FrameCameraBase;

  /**
   * The current depth buffer of the frame.
   *
   * This property will automatically be set when supplying a viewer to the
   * component, or when added as a child to `<vertex-viewer>`.
   */
  @Prop({ mutable: true })
  public depthBuffer?: DepthBuffer;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private invalidateFrameCounter = 0;

  @State()
  private interactionDisposables: Disposable[] = [];

  @Element()
  private hostEl!: HTMLElement;

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    const resized = new ResizeObserver(() => this.handleResize());
    resized.observe(this.hostEl);

    const mutation = new MutationObserver(() => this.handleChildrenChange());
    mutation.observe(this.hostEl, { childList: true });

    this.handleViewerChange(this.viewer, undefined);

    if (this.viewer?.frame != null) {
      this.handleViewerFrameDrawn();
    }
  }

  /**
   * @ignore
   */
  public render(): h.JSX.IntrinsicElements {
    if (this.camera != null) {
      if (this.drawMode === '2d') {
        return (
          <Host>
            <Renderer2d>
              <slot></slot>
            </Renderer2d>
          </Host>
        );
      } else {
        return (
          <Host>
            <Renderer3d camera={this.camera} viewport={this.viewport}>
              <slot></slot>
            </Renderer3d>
          </Host>
        );
      }
    } else {
      return <Host></Host>;
    }
  }

  /**
   * @ignore
   */
  protected componentWillRender(): void {
    this.updateElements();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChange(
    newViewer: HTMLVertexViewerElement | undefined,
    oldViewer: HTMLVertexViewerElement | undefined
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);

    if (this.propagateEventsToViewer && newViewer != null) {
      this.handleEventPropagationToViewer(newViewer);
    }
  }

  /**
   * @ignore
   */
  @Listen('propertyChange')
  protected handlePropertyChange(): void {
    this.invalidateFrame();
  }

  private invalidateFrame(): void {
    this.invalidateFrameCounter = this.invalidateFrameCounter + 1;
  }

  /**
   * disposes any existing disposables, and registers new handlers on the newly provided viewer.
   * @param newViewer
   */
  private handleEventPropagationToViewer(
    newViewer: HTMLVertexViewerElement
  ): void {
    this.interactionDisposables.forEach((disposable) => {
      disposable.dispose();
    });

    this.interactionDisposables = [];

    newViewer.getInteractionHandlers().then((handlers) => {
      handlers.forEach((handler) => {
        if (handler instanceof MultiElementInteractionHandler) {
          const disposable = handler.registerAdditionalElement(this.hostEl);

          this.interactionDisposables = [
            ...this.interactionDisposables,
            disposable,
          ];
        }
      });
    });
  }

  private async updateElements(): Promise<void> {
    const { viewport, camera } = this;
    const worldMatrix = Matrix4.makeIdentity();

    if (camera != null) {
      if (this.drawMode === '3d') {
        update3d(this.hostEl, worldMatrix, viewport, camera, this.depthBuffer);
      } else {
        update2d(this.hostEl, worldMatrix, viewport, camera, this.depthBuffer);
      }
    }
  }

  private handleViewerFrameDrawn = async (): Promise<void> => {
    this.updatePropsFromViewer();
  };

  private handleResize(): void {
    const bounds = this.hostEl.getBoundingClientRect();
    this.viewport = new Viewport(bounds.width, bounds.height);
  }

  private handleChildrenChange(): void {
    this.invalidateFrame();
  }

  private async updatePropsFromViewer(): Promise<void> {
    const { frame } = this.viewer || {};

    this.depthBuffer = await frame?.depthBuffer();
    this.camera = frame?.scene.camera;
  }
}
