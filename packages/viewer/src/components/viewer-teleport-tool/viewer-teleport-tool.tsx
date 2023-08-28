import {
  Component,
  Event,
  EventEmitter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Prop,
  Watch,
} from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

import { TeleportInteractionHandler } from '../../lib/teleportation/interactions';
import { WalkModeController } from '../../lib/walk-mode/controller';
import { ViewerTeleportMode, WalkModeModel } from '../../lib/walk-mode/model';

/**
 * The `<vertex-viewer-teleport-tool>` allows for click-based "teleportation"
 * around a model, which is particularly useful for walking through a model.
 * This tool is automatically included as part of the <vertex-viewer-walk-mode-tool>.
 */
@Component({
  tag: 'vertex-viewer-teleport-tool',
  styleUrl: 'viewer-teleport-tool.css',
  shadow: true,
})
export class ViewerTeleportTool {
  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The type of teleportation to perform when clicking.
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
  @Prop({ mutable: true })
  public mode?: ViewerTeleportMode;

  /**
   * Indicates whether animations will be used when performing camera
   * operations. Defaults to `true`.
   */
  @Prop()
  public animationsDisabled = false;

  /**
   * The duration of animations, in milliseconds. Defaults to `1000`.
   */
  @Prop()
  public animationMs?: number = 1000;

  @Prop({ mutable: true })
  public controller?: WalkModeController;

  @Prop({ mutable: true })
  public model: WalkModeModel = new WalkModeModel();

  /**
   * Event emitted when the `WalkModeController` associated with this tool changes.
   */
  @Event()
  public controllerChanged!: EventEmitter<WalkModeController>;

  private interactionHandlerDisposable?: Disposable;
  private interactionHandler?: TeleportInteractionHandler;

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
  @Watch('mode')
  protected handleModeChange(): void {
    this.controller?.setTeleportMode(this.mode);
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(): void {
    this.setupInteractionHandler();
  }

  @Watch('animationMs')
  protected handleAnimationMsChanged(): void {
    if (this.animationMs != null) {
      this.interactionHandler?.setAnimations({ durationMs: this.animationMs });
    }
  }

  @Watch('animationsDisabled')
  protected handleAnimationsDisabledChanged(): void {
    if (this.animationsDisabled) {
      this.interactionHandler?.setAnimations(undefined);
    } else if (this.animationMs != null) {
      this.interactionHandler?.setAnimations({ durationMs: this.animationMs });
    }
  }

  @Watch('controller')
  protected handleControllerChanged(): void {
    this.setupInteractionHandler();
    this.controllerChanged.emit(this.controller);
  }

  protected render(): JSX.Element {
    return <Host></Host>;
  }

  private setupController(): void {
    if (this.controller == null) {
      this.controller = new WalkModeController(this.model);
      this.controller.setTeleportMode(this.mode);
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
    this.interactionHandler = new TeleportInteractionHandler(
      this.model,
      !this.animationsDisabled && this.animationMs != null
        ? { durationMs: this.animationMs }
        : undefined
    );

    this.interactionHandlerDisposable =
      await this.viewer?.registerInteractionHandler(this.interactionHandler);
  }
}
