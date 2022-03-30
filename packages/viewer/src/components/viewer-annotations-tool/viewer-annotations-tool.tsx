import {
  Component,
  Element,
  Fragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { Viewport } from '../..';
import { Config } from '../../lib/config';
import { PinController } from '../../lib/pins/controller';
import { Pin, PinEntity } from '../../lib/pins/entities';
import { PinsInteractionHandler } from '../../lib/pins/interactions';
import { PinModel } from '../../lib/pins/model';
import { DepthBuffer } from '../../lib/types';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';

@Component({
  tag: 'vertex-viewer-annotations-tool',
  styleUrl: 'viewer-annotations-tool.css',
  shadow: true,
})
export class ViewerAnnotationsTool {
  /**
   * The controller that is responsible for drawing pins and updating the model
   */
  @Prop({ mutable: true })
  public pinController?: PinController;

  /**
   * The model that contains the entities and outcomes from performing pin annotations
   */
  @Prop()
  public pinModel: PinModel = new PinModel();

  @Prop({ mutable: true })
  public pins: PinEntity[] = [];

  @State()
  private selectedPinId?: string;

  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * An optional configuration to setup network configuration of measurement
   * endpoints.
   */
  @Prop()
  public config?: Config;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private elementBounds?: DOMRect;

  @State()
  private projectionViewMatrix?: Matrix4.Matrix4;

  private registeredInteractionHandler?: Promise<Disposable>;
  private onEntitiesChangedHandler?: Disposable;
  private onOverlaysChangedHandler?: Disposable;

  private depthBuffer: DepthBuffer | undefined;

  /**
   * @ignore
   */
  protected connectedCallback(): void {
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.updateViewport();
    this.setupController();
    this.setupInteractionHandler();

    this.pinModel.onEntitiesChanged((entities) => {
      this.pins = entities;
    });

    this.pinModel.onSelectionChange((selectedId) => {
      this.selectedPinId = selectedId;
    });
  }

  protected componentDidLoad(): void {
    const resize = new ResizeObserver(() => this.updateViewport());
    resize.observe(this.hostEl);
  }

  /**
   * @ignore
   */
  protected disconnectedCallback(): void {
    this.clearInteractionHandler();
    this.clearModelListeners();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    this.setupInteractionHandler();
    if (oldViewer != null) {
      oldViewer.removeEventListener('frameDrawn', this.handleFrameDrawn);
    }

    if (newViewer != null) {
      newViewer.addEventListener('frameDrawn', this.handleFrameDrawn);
    }
  }

  private handleFrameDrawn = (): void => {
    this.projectionViewMatrix =
      this.viewer?.frame?.scene.camera.projectionViewMatrix;
  };

  protected render(): JSX.Element {
    return (
      <Host>
        <vertex-viewer-dom-renderer viewer={this.viewer} drawMode="2d">
          {this.pins.map((pin, i) => {
            if (this.elementBounds == null) {
              throw new Error('Dimensions not present for pin renderer');
            }

            return (
              <vertex-viewer-annotations-pin-group
                data-is-dom-group-element={true}
                pin={pin}
                dimensions={this.elementBounds}
                pinModel={this.pinModel}
                projectionViewMatrix={this.projectionViewMatrix}
              ></vertex-viewer-annotations-pin-group>
            );
          })}
        </vertex-viewer-dom-renderer>
      </Host>
    );
  }

  private setupController(): void {
    this.pinController = new PinController(this.pinModel);
  }

  private clearInteractionHandler(): void {
    this.registeredInteractionHandler?.then((handler) => handler.dispose());
    this.registeredInteractionHandler = undefined;
  }

  private setupInteractionHandler(): void {
    this.clearInteractionHandler();

    if (this.pinController != null) {
      this.registeredInteractionHandler =
        this.viewer?.registerInteractionHandler(
          new PinsInteractionHandler(this.pinController)
        );
    }
  }

  private clearModelListeners(): void {
    this.onEntitiesChangedHandler?.dispose();
    this.onEntitiesChangedHandler = undefined;

    this.onOverlaysChangedHandler?.dispose();
    this.onOverlaysChangedHandler = undefined;
  }

  private updateViewport(): void {
    const rect = getMarkupBoundingClientRect(this.hostEl);
    this.elementBounds = rect;
  }

  private getFromWorldPosition(pt: Vector3.Vector3): Point.Point | undefined {
    const projectionViewMatrix = this.depthBuffer?.camera.projectionViewMatrix;

    if (this.elementBounds != null && projectionViewMatrix != null) {
      const ndcPt = Vector3.transformMatrix(pt, projectionViewMatrix);
      return Viewport.fromDimensions(
        this.elementBounds
      ).transformVectorToViewport(ndcPt);
    }
  }
}
