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
import { Point, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { Viewport } from '../..';
import { Config } from '../../lib/config';
import { PinController } from '../../lib/pins/controller';
import { PinEntity, TextPinEntity } from '../../lib/pins/entities';
import { PinsInteractionHandler } from '../../lib/pins/interactions';
import { PinModel } from '../../lib/pins/model';
import { DepthBuffer, Frame } from '../../lib/types';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';
import { ViewerMeasurementDistanceElementMetrics } from '../viewer-measurement-distance/viewer-measurement-distance';
import { DrawablePinRenderer } from './drawable-pin';

@Component({
  tag: 'vertex-viewer-annotations-pin',
  styleUrl: 'viewer-annotations-pin.css',
  shadow: true,
})
export class ViewerAnnotationsPin {
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
  public pins: TextPinEntity[] = [];

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
  private invalidateStateCounter = 0;

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
    this.invalidateState();
    this.viewer?.frame?.depthBuffer().then((db) => {
      if (db != null) {
        this.depthBuffer = db;
      }
    });
  };

  /**
   * Computes the bounding boxes of the anchors and label. **Note:** invoking
   * this function uses `getBoundingClientRect` internally and will cause a
   * relayout of the DOM.
   */
  @Method()
  public async computeElementMetrics(): Promise<
    ViewerMeasurementDistanceElementMetrics | undefined
  > {
    const startAnchorEl =
      this.hostEl.shadowRoot?.getElementById('start-anchor');
    const endAnchorEl = this.hostEl.shadowRoot?.getElementById('end-anchor');
    const labelEl = this.hostEl.shadowRoot?.getElementById('label');

    if (startAnchorEl != null && endAnchorEl != null && labelEl != null) {
      return {
        startAnchor: startAnchorEl.getBoundingClientRect(),
        endAnchor: endAnchorEl.getBoundingClientRect(),
        label: labelEl.getBoundingClientRect(),
      };
    } else {
      return undefined;
    }
  }

  protected render(): JSX.Element {
    const onUpdatePin = (
      currentPin: TextPinEntity,
      updatedPin: TextPinEntity
    ): void => {
      this.pinModel.setEntities(
        new Set([
          ...this.pins.filter((p) => p.id !== currentPin.id),
          updatedPin,
        ])
      );
    };

    return (
      <Host>
        <vertex-viewer-dom-renderer viewer={this.viewer} drawMode="2d">
          {this.pins.map((pin, i) => {
            if (this.elementBounds == null) {
              throw new Error('Dimensions not present for pin renderer');
            }
            if (this.viewer?.frame?.scene.camera.viewMatrix == null) {
              throw new Error('View Matrix not present for pin renderer');
            }
            return (
              // <vertex-viewer-annotations-pin-group
              //   pin={pin}
              //   dimensions={this.elementBounds}
              //   pinModel={this.pinModel}
              //   viewer={this.viewer}
              // ></vertex-viewer-annotations-pin-group>
              <DrawablePinRenderer
                pin={pin}
                selected={false}
                dimensions={this.elementBounds}
                viewer={this.viewer}
                projectionViewMatrix={
                  this.viewer.frame.scene.camera.projectionViewMatrix
                }
                onUpdatePin={(updatedPin) => {
                  onUpdatePin(pin, updatedPin);
                }}
                pinModel={this.pinModel}
              />
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

  private invalidateState(): void {
    this.invalidateStateCounter = this.invalidateStateCounter + 1;
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
