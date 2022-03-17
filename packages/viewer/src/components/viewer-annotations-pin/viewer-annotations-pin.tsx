import {
  Component,
  Element,
  Fragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Method,
  Prop,
  Watch,
} from '@stencil/core';
import { Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { Config } from '../../lib/config';
import { cssTransformCenterAt } from '../../lib/dom';
import { PinController } from '../../lib/pins/controller';
import { PinEntity } from '../../lib/pins/entities';
import { PinsInteractionHandler } from '../../lib/pins/interactions';
import { PinModel } from '../../lib/pins/model';
import { ViewerMeasurementDistanceElementMetrics } from '../viewer-measurement-distance/viewer-measurement-distance';

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

  @Prop()
  public pins: PinEntity[] = [];

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

  private registeredInteractionHandler?: Promise<Disposable>;
  private onEntitiesChangedHandler?: Disposable;
  private onOverlaysChangedHandler?: Disposable;

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
    this.setupController();
    this.setupInteractionHandler();

    this.pinModel.onEntitiesChanged((entities) => {
      console.log('entitiesChanged in viewer annotations-pin: ', entities);
      this.pins = entities;
    });
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
  protected handleViewerChanged(): void {
    this.setupInteractionHandler();
  }

  @Watch('pinModel')
  protected pinModelChanged(): void {
    console.log('this.pinModel: ', this.pinModel);
  }

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
    console.log('rendering: ', this.pins);

    return (
      <Host>
        <vertex-viewer-dom-renderer viewer={this.viewer} drawMode="2d">
          {this.pins.map((m, i) => {
            return (
              // <div
              //   id="start-anchor"
              //   class="anchor anchor-start"
              //   style={{ transform: cssTransformCenterAt(m.point) }}
              //   onPointerDown={(event) => console.log('pointer: ', event)}
              // >
              //   <slot name="start-anchor">
              //     <div class="anchor-placeholder"></div>
              //   </slot>
              // </div>
              <vertex-viewer-dom-element
                key={`drawn-pin-${i}`}
                data-testid={`drawn-pin-${i}`}
                occluded={true}
                position={m.worldPosition}
              >
                <div
                  id="start-anchor"
                  class="pin-anchor"
                  // style={{ transform: cssTrsansformCenterAt(m.point) }}
                  onPointerDown={(event) => console.log('pointer: ', event)}
                >
                  {/* <slot name="start-anchor">
                  <div class="anchor-placeholder"></div>
                </slot> */}
                </div>
                {/* <vertex-viewer-icon
                  name="pin-fill"
                  class="pin"
                  size="lg"
                ></vertex-viewer-icon> */}
              </vertex-viewer-dom-element>
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
}
