import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { Rectangle } from '@vertexvis/geometry';

import { ViewerDragSelectController } from './controller';
import { ViewerDragSelectInteractionHandler } from './interaction-handler';
import { ViewerDragSelectModel } from './model';

@Component({
  tag: 'vertex-viewer-drag-select',
  styleUrl: 'viewer-drag-select.css',
  shadow: true,
})
export class ViewerDragSelect {
  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Prop()
  public controller?: ViewerDragSelectController;

  @State()
  private dragRect?: Rectangle.Rectangle;

  private interactionModel!: ViewerDragSelectModel;
  private interactionHandler?: ViewerDragSelectInteractionHandler;

  public constructor() {
    this.handleBoundsChanged = this.handleBoundsChanged.bind(this);
  }

  public componentWillLoad(): void {
    this.interactionModel = new ViewerDragSelectModel();

    this.interactionModel.onBoundsChanged(this.handleBoundsChanged);

    this.handleViewerChanged(this.viewer);
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(newViewer?: HTMLVertexViewerElement): void {
    this.deregisterInteractionHandler();

    if (newViewer?.stream != null) {
      this.registerInteractionHandler(newViewer);
      this.controller = new ViewerDragSelectController(
        newViewer,
        this.interactionModel
      );
    }
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <vertex-viewer-layer>
          {this.dragRect != null && (
            <div
              class="outline"
              style={{
                left: `${this.dragRect.x}px`,
                top: `${this.dragRect.y}px`,
                width: `${this.dragRect.width}px`,
                height: `${this.dragRect.height}px`,
              }}
            >
              <div class="fill" />
            </div>
          )}
        </vertex-viewer-layer>
      </Host>
    );
  }

  private handleBoundsChanged(bounds: Rectangle.Rectangle | undefined): void {
    this.dragRect = bounds;
  }

  private registerInteractionHandler(viewer: HTMLVertexViewerElement): void {
    this.interactionHandler = new ViewerDragSelectInteractionHandler(
      viewer,
      this.interactionModel
    );
    viewer.registerInteractionHandler(this.interactionHandler);
  }

  private deregisterInteractionHandler(): void {
    this.interactionHandler?.dispose();
    this.interactionHandler = undefined;
  }
}
