import { Component, Element, h, Host, Prop, State, Watch } from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

import { VolumeIntersectionQueryController } from '../../lib/volume-intersection/controller';
import { VolumeIntersectionQueryInteractionHandler } from '../../lib/volume-intersection/interactions';
import {
  QueryType,
  VolumeIntersectionQueryDetails,
  VolumeIntersectionQueryModel,
} from '../../lib/volume-intersection/model';

export type DefaultOperationType = 'select' | 'deselect';

@Component({
  tag: 'vertex-viewer-intersection-query-tool',
  styleUrl: 'viewer-intersection-query-tool.css',
  shadow: true,
})
export class ViewerIntersectionQueryTool {
  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The controller that is responsible for performing operations using the
   * intersection query and updating the model.
   */
  @Prop({ mutable: true })
  public controller?: VolumeIntersectionQueryController;

  /**
   * The model that contains the points representing the corners of the box
   * displayed on screen, the type of the query to be performed, and methods
   * for setting these values.
   */
  @Prop({ mutable: true })
  public model?: VolumeIntersectionQueryModel;

  /**
   * The default operation to perform when a drag has completed and the intersection
   * query will be run. Defaults to `select`, and can be changed to `deselect`.
   *
   * The operation behavior for this intersection query tool can also be changed by
   * providing a custom implementation of the `VolumeIntersectionQueryController`, or
   * by using the `setOperationTransform` method of the default controller.
   */
  @Prop()
  public defaultOperation: DefaultOperationType = 'select';

  @State()
  private details?: VolumeIntersectionQueryDetails;

  @Element()
  private hostEl!: HTMLVertexViewerIntersectionQueryToolElement;

  private interactionHandler?: VolumeIntersectionQueryInteractionHandler;

  private screenBoundsChangedDisposable?: Disposable;

  public constructor() {
    this.handleScreenBoundsChanged = this.handleScreenBoundsChanged.bind(this);
  }

  public componentWillLoad(): void {
    this.model = this.model ?? new VolumeIntersectionQueryModel();

    this.screenBoundsChangedDisposable = this.model.onScreenBoundsChanged(
      this.handleScreenBoundsChanged
    );

    this.handleViewerChanged(this.viewer);
  }

  public disconnectedCallback(): void {
    this.model?.reset();
    this.screenBoundsChangedDisposable?.dispose();
    this.interactionHandler?.dispose();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(newViewer?: HTMLVertexViewerElement): void {
    this.deregisterInteractionHandler();

    if (this.model != null && newViewer != null) {
      this.controller = new VolumeIntersectionQueryController(
        this.model,
        newViewer
      );
      this.handleDefaultOperationChange(this.defaultOperation);
      this.registerInteractionHandler(this.controller, newViewer);
    }
  }

  /**
   * @ignore
   */
  @Watch('defaultOperation')
  protected handleDefaultOperationChange(
    updatedDefaultOperation: DefaultOperationType
  ): void {
    this.controller?.setOperationTransform(
      updatedDefaultOperation === 'select'
        ? (builder) => builder.select()
        : (builder) => builder.deselect()
    );
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <vertex-viewer-layer>
          {this.details != null && (
            <div
              class="bounds"
              style={{
                left: `${this.details.screenBounds.x}px`,
                top: `${this.details.screenBounds.y}px`,
                width: `${this.details.screenBounds.width}px`,
                height: `${this.details.screenBounds.height}px`,
              }}
            >
              <slot name="bounds">
                <div class="outline">
                  <div class="fill" />
                </div>
              </slot>
            </div>
          )}
        </vertex-viewer-layer>
      </Host>
    );
  }

  private handleScreenBoundsChanged(
    details?: VolumeIntersectionQueryDetails
  ): void {
    this.details = details;

    this.updateTypeAttribute(details?.type);
  }

  private registerInteractionHandler(
    controller: VolumeIntersectionQueryController,
    viewer: HTMLVertexViewerElement
  ): void {
    this.interactionHandler = new VolumeIntersectionQueryInteractionHandler(
      controller
    );
    viewer.registerInteractionHandler(this.interactionHandler);
  }

  private deregisterInteractionHandler(): void {
    this.interactionHandler?.dispose();
    this.interactionHandler = undefined;
  }

  private updateTypeAttribute(type?: QueryType): void {
    this.hostEl.setAttribute('inclusive', `${type === 'inclusive'}`);
    this.hostEl.setAttribute('exclusive', `${type === 'exclusive'}`);
  }
}
