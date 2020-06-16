import { h, Host, Component, Prop, State, Watch } from '@stencil/core';
import { MouseInteractionHandler } from '../../interactions/mouseInteractionHandler';
import { Disposable } from '../../utils';

@Component({
  tag: 'viewer-toolbar-camera-tools',
  styleUrl: 'viewer-toolbar-camera-tools.css',
})
export class CameraTools {
  /**
   * The `vertex-viewer` component that this toolbar will interact with.
   * This property can be injected by the `vertex-viewer` when a `data-viewer="{{viewer element id}}"` attribute is present.
   */
  @Prop() public viewer?: HTMLVertexViewerElement;

  @State() public interactionType?: string;

  private interactionHandler?: MouseInteractionHandler;
  private interactionChangeSubscription?: Disposable;

  public constructor() {
    this.handleInteractionTypeChange = this.handleInteractionTypeChange.bind(
      this
    );
  }

  public componentWillLoad(): void {
    if (this.viewer != null) {
      this.handleViewerSet(this.viewer);
    }
  }

  public componentDidUnload(): void {
    this.interactionChangeSubscription?.dispose();
    this.interactionChangeSubscription = null;
  }

  @Watch('viewer')
  public async handleViewerSet(viewer: HTMLVertexViewerElement): Promise<void> {
    const handlers = await viewer.getInteractionHandlers();
    this.interactionHandler = handlers.find(
      handler => handler instanceof MouseInteractionHandler
    ) as MouseInteractionHandler | undefined;

    if (this.interactionHandler != null) {
      this.handleInteractionTypeChange();
      this.interactionChangeSubscription = this.interactionHandler.onPrimaryInteractionTypeChange(
        this.handleInteractionTypeChange
      );
    }
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <viewer-toolbar-rotate-tool
          selected={this.interactionType === 'rotate'}
          onClick={() =>
            this.interactionHandler?.setPrimaryInteractionType('rotate')
          }
        />
        <viewer-toolbar-pan-tool
          selected={this.interactionType === 'pan'}
          onClick={() =>
            this.interactionHandler?.setPrimaryInteractionType('pan')
          }
        />
        <viewer-toolbar-zoom-tool
          selected={this.interactionType === 'zoom'}
          onClick={() =>
            this.interactionHandler?.setPrimaryInteractionType('zoom')
          }
        />
      </Host>
    );
  }

  private handleInteractionTypeChange(): void {
    this.interactionType = this.interactionHandler?.getPrimaryInteractionType();
  }
}
