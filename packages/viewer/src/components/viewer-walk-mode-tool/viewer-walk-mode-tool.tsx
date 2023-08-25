import {
  Component,
  Element,
  Event,
  EventEmitter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Prop,
  Watch,
} from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

import { InteractionType } from '../../lib/interactions/baseInteractionHandler';
import { WalkModeController } from '../../lib/walk-mode/controller';
import { WalkInteractionHandler } from '../../lib/walk-mode/interactions';
import { ViewerTeleportMode, WalkModeModel } from '../../lib/walk-mode/model';

interface StateMap {
  teleportTool?: HTMLVertexViewerTeleportToolElement;
  previousPrimaryInteractionType?: InteractionType;
}

/**
 * The `<vertex-viewer-walk-mode-tool>` allows for additional interactions
 * intended for walking through a model instead of orbiting a model.
 */
@Component({
  tag: 'vertex-viewer-walk-mode-tool',
  styleUrl: 'viewer-walk-mode-tool.css',
  shadow: true,
})
export class ViewerWalkModeTool {
  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The `WalkModeController` responsible for controlling `KeyBinding`s and excluded
   * elements, as well as updating the `WalkModeModel` with various configuration
   * settings.
   */
  @Prop({ mutable: true })
  public controller?: WalkModeController;

  /**
   * The `WalkModeModel` responsible for tracking configuration and emitting
   * events for interaction handlers to respond to.
   */
  @Prop({ mutable: true })
  public model: WalkModeModel = new WalkModeModel();

  /**
   * The type of teleportation to perform when clicking. This value is passed through
   * to a `<vertex-viewer-teleport-tool>`'s mode attribute.
   *
   * `teleport` - the camera's `position` is moved to the location of the hit result
   * constrained by the plane represented by the camera's current `position` and `up`
   * vectors.
   *
   * `teleport-and-align` - the camera's `position`, `lookAt`, and `up` vectors are updated
   * to align to the plane represented by the hit result's position and normal.
   *
   * `undefined` - no teleportation will occur when clicking.
   *
   * Defaults to `undefined`.
   */
  @Prop()
  public teleportMode?: ViewerTeleportMode;

  /**
   * Determines whether the interaction handlers for this tool should respond to events.
   * When set to `true`, the default viewer interaction mode will be overridden to use the
   * `pivot` camera interaction type, keyboard controls for movement will be added, and
   * setting the `teleportMode` will enable the tool.
   *
   * Defaults to `true`.
   */
  @Prop()
  public enabled = true;

  /**
   * Event emitted when the `WalkModeController` associated with this tool changes.
   */
  @Event()
  public controllerChanged!: EventEmitter<WalkModeController>;

  @Element()
  private hostEl!: HTMLElement;

  private interactionHandlerDisposable?: Disposable;
  private interactionHandler?: WalkInteractionHandler;

  private stateMap: StateMap = {};

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.setupController();
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.ensureTeleportToolConfigured();
    this.updateTeleportTool();
    this.updateViewerInteractionMode();
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
  protected disconnectedCallback(): void {
    this.clearInteractionHandler();
  }

  /**
   * @ignore
   */
  @Watch('enabled')
  protected handleEnabledChanged(): void {
    this.controller?.setEnabled(this.enabled);
    this.updateViewerInteractionMode();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(): void {
    this.setupInteractionHandler();
    this.updateTeleportTool();
    this.updateViewerInteractionMode();
  }

  /**
   * @ignore
   */
  @Watch('controller')
  @Watch('model')
  @Watch('teleportMode')
  protected handleTeleportToolPropChanged(): void {
    this.updateTeleportTool();
  }

  protected handleControllerChanged(): void {
    this.updateTeleportTool();
    this.controllerChanged.emit(this.controller);
  }

  protected render(): JSX.Element {
    return (
      <Host>
        <slot
          name="teleport-tool"
          onSlotchange={this.ensureTeleportToolConfigured}
        ></slot>
      </Host>
    );
  }

  private setupController(): void {
    if (this.controller == null) {
      this.controller = new WalkModeController(this.model);
      this.controllerChanged.emit(this.controller);
    }
  }

  private clearInteractionHandler(): void {
    this.interactionHandlerDisposable?.dispose();
    this.interactionHandlerDisposable = undefined;
    this.interactionHandler?.dispose();
    this.interactionHandler = undefined;
  }

  private async setupInteractionHandler(): Promise<void> {
    this.clearInteractionHandler();

    this.interactionHandler = new WalkInteractionHandler(this.model);

    this.interactionHandlerDisposable =
      await this.viewer?.registerInteractionHandler(this.interactionHandler);
  }

  private async ensureTeleportToolConfigured(): Promise<void> {
    const slotted: Element | undefined =
      this.hostEl.querySelector(
        'vertex-viewer-teleport-tool[slot="teleport-tool"]'
      ) ?? undefined;
    const slottedTeleportTool =
      slotted?.tagName === 'VERTEX-VIEWER-TELEPORT-TOOL'
        ? (slotted as HTMLVertexViewerTeleportToolElement)
        : undefined;

    if (slottedTeleportTool != null) {
      this.stateMap.teleportTool = slottedTeleportTool;
    } else {
      const slot: HTMLSlotElement | undefined =
        this.hostEl?.shadowRoot?.querySelector('slot[name="teleport-tool"]') ??
        undefined;

      this.stateMap.teleportTool = document.createElement(
        'vertex-viewer-teleport-tool'
      );
      slot?.appendChild(this.stateMap.teleportTool);
    }
  }

  private updateTeleportTool(): void {
    if (this.stateMap.teleportTool != null) {
      this.stateMap.teleportTool.viewer = this.viewer;
      this.stateMap.teleportTool.controller = this.controller;
      this.stateMap.teleportTool.model = this.model;
      this.stateMap.teleportTool.mode = this.teleportMode;
    }
  }

  private async updateViewerInteractionMode(): Promise<void> {
    const baseInteractionHandler =
      await this.viewer?.getBaseInteractionHandler();
    if (this.enabled && baseInteractionHandler != null) {
      this.stateMap.previousPrimaryInteractionType =
        baseInteractionHandler.getPrimaryInteractionType();
      baseInteractionHandler.setPrimaryInteractionType('pivot');
    } else if (
      baseInteractionHandler != null &&
      baseInteractionHandler.getPrimaryInteractionType() === 'pivot' &&
      this.stateMap.previousPrimaryInteractionType != null
    ) {
      baseInteractionHandler.setPrimaryInteractionType(
        this.stateMap.previousPrimaryInteractionType
      );
      this.stateMap.previousPrimaryInteractionType = undefined;
    }
  }
}
