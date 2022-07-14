import {
  Component,
  Element,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { Matrix4 } from '@vertexvis/geometry';
import { Color, Disposable } from '@vertexvis/utils';

import { PinController } from '../../lib/pins/controller';
import { PinsInteractionHandler } from '../../lib/pins/interactions';
import {
  Pin,
  PinModel,
  ViewerPinToolMode,
  ViewerPinToolType,
} from '../../lib/pins/model';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';

@Component({
  tag: 'vertex-viewer-pin-tool',
  styleUrl: 'viewer-pin-tool.css',
  shadow: true,
})
export class ViewerPinTool {
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

  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The type of pin.
   *
   * This property will automatically be set.
   */
  @Prop({ mutable: true })
  public tool: ViewerPinToolType = 'pin-icon';

  /**
   * The mode of the pin tool
   */
  @Prop({ mutable: true })
  public mode: ViewerPinToolMode = 'view';

  /**
   * The primary color for new pins.
   */
  @Prop({ mutable: true })
  public primaryColor: Color.Color | string | undefined;

  /**
   * The accent color for new pins.
   */
  @Prop({ mutable: true })
  public accentColor: Color.Color | string | undefined;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private pins: Pin[] = [];

  @State()
  private selectedPinId?: string;

  @State()
  private elementBounds?: DOMRect;

  @State()
  private projectionViewMatrix?: Matrix4.Matrix4;

  private registeredInteractionHandler?: Promise<Disposable>;
  private onEntitiesChangedHandler?: Disposable;

  private resizeObserver?: ResizeObserver;

  /**
   * @ignore
   */
  @Watch('mode')
  protected watchModeChange(): void {
    this.pinController?.setToolMode(this.mode);
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  @Watch('tool')
  protected watchTypeChange(): void {
    this.pinController?.setToolType(this.tool);
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  @Watch('accentColor')
  protected watchAccentColorChange(): void {
    this.pinController?.setAccentColor(this.accentColor);
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  @Watch('primaryColor')
  protected watchPrimaryColorChange(): void {
    this.pinController?.setPrimaryColor(this.primaryColor);
    this.setupInteractionHandler();
  }

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
    this.resizeObserver = new ResizeObserver(() => this.updateViewport());
    this.resizeObserver.observe(this.hostEl);
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
      oldViewer.removeEventListener(
        'frameDrawn',
        this.handleSetProjectionMatrix
      );
    }

    if (newViewer != null) {
      newViewer.addEventListener('frameDrawn', this.handleSetProjectionMatrix);
    }

    this.handleSetProjectionMatrix();
  }

  private handleSetProjectionMatrix = (): void => {
    this.projectionViewMatrix =
      this.viewer?.frame?.scene.camera.projectionViewMatrix;
  };

  protected render(): JSX.Element {
    return (
      <Host>
        <vertex-viewer-dom-renderer viewer={this.viewer} drawMode="2d">
          {this.pins.map((pin) => {
            return (
              <vertex-viewer-pin-group
                id={`pin-group-${pin.id}`}
                data-is-dom-group-element={true}
                pin={pin}
                elementBounds={this.elementBounds}
                pinModel={this.pinModel}
                pinController={this.pinController}
                projectionViewMatrix={this.projectionViewMatrix}
                selected={this.selectedPinId === pin.id}
              ></vertex-viewer-pin-group>
            );
          })}
        </vertex-viewer-dom-renderer>
      </Host>
    );
  }

  private setupController(): void {
    const attributes =
      this.accentColor || this.primaryColor
        ? {
            accentColor: this.accentColor,
            primaryColor: this.primaryColor,
          }
        : undefined;
    this.pinController = new PinController(
      this.pinModel,
      this.mode,
      this.tool,
      attributes
    );
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
    this.resizeObserver?.disconnect();
  }

  private updateViewport(): void {
    const rect = getMarkupBoundingClientRect(this.hostEl);
    this.elementBounds = rect;
  }
}
