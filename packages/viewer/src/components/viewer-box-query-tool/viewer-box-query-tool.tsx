import { Component, Element, h, Host, Prop, State, Watch } from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

import { VolumeIntersectionQueryController } from '../../lib/volume-intersection/controller';
import { VolumeIntersectionQueryInteractionHandler } from '../../lib/volume-intersection/interactions';
import {
  QueryType,
  VolumeIntersectionQueryDetails,
  VolumeIntersectionQueryModel,
} from '../../lib/volume-intersection/model';

export type VolumeIntersectionQueryType = 'select' | 'deselect';

export type VolumeIntersectionQueryMode = 'exclusive' | 'inclusive';

/**
 * The `ViewerBoxQueryTool` allows for the drawing of a "box" on screen to represent
 * a query for items in a specific area of the viewer. This tool then allows for an
 * operation to be performed on the items contained (exclusive) by the box or both
 * contained by and intersecting with (inclusive) the box.
 */
@Component({
  tag: 'vertex-viewer-box-query-tool',
  styleUrl: 'viewer-box-query-tool.css',
  shadow: true,
})
export class ViewerBoxQueryTool {
  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The controller that is responsible for performing operations using the
   * volume intersection query defined by the drawn box and updating the model.
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
  public operationType: VolumeIntersectionQueryType = 'select';

  /**
   * An optional value to specify a singular mode of intersection query. This value
   * defaults to `undefined`, which will indicate that both `exclusive` and `inclusive`
   * queries should be made, with `inclusive` being represented by a left to right
   * drag behavior and `exclusive` being represented by a right to left drag.
   *
   * Setting this value to `inclusive` will cause dragging left to right and left to right
   * to result in an `inclusive` query, and the box will only be styled for `inclusive` queries.
   *
   * Setting this value to `exclusive` will cause dragging left to right and left to right
   * to result in an `exclusive` query, and the box will only be styled for `exclusive` queries.
   */
  @Prop()
  public mode?: VolumeIntersectionQueryMode;

  @State()
  private details?: VolumeIntersectionQueryDetails;

  @Element()
  private hostEl!: HTMLVertexViewerBoxQueryToolElement;

  private interactionHandler?: VolumeIntersectionQueryInteractionHandler;
  private interactionHandlerDisposable?: Disposable;

  private operationStartedDisposable?: Disposable;
  private operationCompleteDisposable?: Disposable;
  private screenBoundsChangedDisposable?: Disposable;

  public constructor() {
    this.handleScreenBoundsChanged = this.handleScreenBoundsChanged.bind(this);
    this.handleExecuteStarted = this.handleExecuteStarted.bind(this);
    this.handleExecuteComplete = this.handleExecuteComplete.bind(this);
  }

  public componentWillLoad(): void {
    this.model = this.model ?? new VolumeIntersectionQueryModel(this.mode);

    this.screenBoundsChangedDisposable = this.model.onScreenBoundsChanged(
      this.handleScreenBoundsChanged
    );

    this.handleViewerChanged(this.viewer);
    this.handleControllerChange(this.controller);
  }

  public disconnectedCallback(): void {
    this.model?.reset();
    this.screenBoundsChangedDisposable?.dispose();
    this.operationStartedDisposable?.dispose();
    this.operationCompleteDisposable?.dispose();
    this.deregisterInteractionHandler();
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
      this.handleDefaultOperationChange(this.operationType);
      this.registerInteractionHandler(this.controller, newViewer);
    }
  }

  /**
   * @ignore
   */
  @Watch('operationType')
  protected handleDefaultOperationChange(
    updatedOperationType: VolumeIntersectionQueryType
  ): void {
    this.controller?.setOperationTransform(
      updatedOperationType === 'select'
        ? (builder) => builder.select()
        : (builder) => builder.deselect()
    );
  }

  /**
   * @ignore
   */
  @Watch('mode')
  protected handleModeChange(updatedMode?: VolumeIntersectionQueryMode): void {
    this.model?.setMode(updatedMode);
  }

  /**
   * @ignore
   */
  @Watch('controller')
  protected handleControllerChange(
    controller?: VolumeIntersectionQueryController
  ): void {
    this.operationStartedDisposable?.dispose();
    this.operationCompleteDisposable?.dispose();

    this.operationStartedDisposable = controller?.onExecuteStarted(
      this.handleExecuteStarted
    );
    this.operationStartedDisposable = controller?.onExecuteComplete(
      this.handleExecuteComplete
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

  private handleExecuteStarted(): void {
    this.interactionHandler?.disable();
  }

  private handleExecuteComplete(): void {
    this.interactionHandler?.enable();
  }

  private async registerInteractionHandler(
    controller: VolumeIntersectionQueryController,
    viewer: HTMLVertexViewerElement
  ): Promise<void> {
    this.interactionHandler = new VolumeIntersectionQueryInteractionHandler(
      controller
    );
    this.interactionHandlerDisposable = await viewer.registerInteractionHandler(
      this.interactionHandler
    );
  }

  private deregisterInteractionHandler(): void {
    this.interactionHandlerDisposable?.dispose();
    this.interactionHandler?.dispose();
    this.interactionHandler = undefined;
  }

  private updateTypeAttribute(type?: QueryType): void {
    this.hostEl.setAttribute('inclusive', `${type === 'inclusive'}`);
    this.hostEl.setAttribute('exclusive', `${type === 'exclusive'}`);
  }
}
