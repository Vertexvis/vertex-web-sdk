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
import { Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { Config } from '../../lib/config';
import { PinController } from '../../lib/pins/controller';
import { PinEntity, TextPinEntity } from '../../lib/pins/entities';
import { PinsInteractionHandler } from '../../lib/pins/interactions';
import { PinModel } from '../../lib/pins/model';
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
  protected handleViewerChanged(): void {
    this.setupInteractionHandler();
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
            return (
              <vertex-viewer-dom-element
                key={`drawn-pin-${i}`}
                data-testid={`drawn-pin-${i}`}
                position={pin.worldPosition}
              >
                <DrawablePinRenderer
                  pin={pin}
                  selected={this.selectedPinId === pin.id}
                  dimensions={this.elementBounds}
                  onSelectPin={(id) => {
                    this.pinController?.setSelectedPinId(id);
                  }}
                  onUpdatePinLabelPosition={async (point) => {
                    const frame = this.viewer?.frame;
                    if (pin.labelOffset != null && frame != null) {
                      console.log('Point: ', point);

                      onUpdatePin(pin, {
                        ...pin,
                        labelOffset: translatePointToRelative(
                          point,
                          frame.dimensions
                        ),
                      });
                    }
                  }}
                  onUpdatePin={(updatedPin) => {
                    onUpdatePin(pin, updatedPin);
                  }}
                />
              </vertex-viewer-dom-element>
            );
          })}
        </vertex-viewer-dom-renderer>

        {this.pins.map((pin, i) => {
          const pointerDownAndMove = (): Disposable => {
            const pointerMove = (event: PointerEvent): void => {
              const frame = this.viewer?.frame;
              if (pin.labelOffset != null && frame != null) {
                const point = {
                  x: event.clientX,
                  y: event.clientY,
                };
                console.log('Point: ', point);

                onUpdatePin(pin, {
                  ...pin,
                  labelOffset: translatePointToRelative(
                    point,
                    frame.dimensions
                  ),
                });
              }
            };

            const dispose = (): void => {
              window.removeEventListener('pointermove', pointerMove);
              window.removeEventListener('pointerup', pointerUp);
            };

            const pointerUp = (): void => dispose();

            window.addEventListener('pointermove', pointerMove);
            window.addEventListener('pointerup', pointerUp);

            return {
              dispose,
            };
          };

          const frame = this.viewer?.frame;
          const screenPosition =
            pin.labelOffset != null && frame?.dimensions != null
              ? translatePointToScreen(pin.labelOffset, frame.dimensions)
              : undefined;
          return (
            <div>
              <input
                id={`pin-label-${pin.id}`}
                class="distance-label"
                type="text"
                placeholder="Untitled Pin"
                onPointerDown={pointerDownAndMove}
                value={pin.labelText}
                onInput={(event) => {
                  onUpdatePin(pin, {
                    ...pin,
                    labelText: (event.target as HTMLInputElement).value,
                  });
                }}
                style={{
                  top: `${screenPosition?.y.toString() || 0}px`,
                  left: `${screenPosition?.x.toString() || 0}px`,
                }}
              />
            </div>
          );
        })}
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
}
