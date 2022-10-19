import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { Rectangle } from '@vertexvis/geometry';
import classNames from 'classnames';

import { ViewerDragSelectController } from './controller';
import { ViewerDragSelectInteractionHandler } from './interaction-handler';
import {
  BoundsChangedEvent,
  ViewerDragSelectDirection,
  ViewerDragSelectModel,
} from './model';

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

  @State()
  private dragDirection?: ViewerDragSelectDirection;

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
              class={classNames('outline', {
                exclusive: this.dragDirection === 'right',
                inclusive: this.dragDirection === 'left',
              })}
              style={{
                left: `${this.dragRect.x}px`,
                top: `${this.dragRect.y}px`,
                width: `${this.dragRect.width}px`,
                height: `${this.dragRect.height}px`,
              }}
            >
              <div
                class={classNames('fill', {
                  exclusive: this.dragDirection === 'right',
                  inclusive: this.dragDirection === 'left',
                })}
              />
            </div>
          )}
        </vertex-viewer-layer>
      </Host>
    );
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.dragRect = event.rectangle;
    this.dragDirection = event.direction;
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
