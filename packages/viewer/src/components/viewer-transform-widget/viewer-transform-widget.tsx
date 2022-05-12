import { Component, h, Host, Prop, Watch } from '@stencil/core';
import { Point, Vector3 } from '@vertexvis/geometry';
import { Color, Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { readDOM, writeDOM } from '../../lib/stencil';
import { TransformController } from '../../lib/transforms/controller';
import { Mesh } from '../../lib/transforms/mesh';
import {
  computeUpdatedPosition,
  convertCanvasPointToWorld,
  convertPointToCanvas,
} from './util';
import { TransformWidget } from './widget';

@Component({
  tag: 'vertex-viewer-transform-widget',
  styleUrl: 'viewer-transform-widget.css',
  shadow: true,
})
export class ViewerTransformWidget {
  /**
   * The viewer to connect to measurements. If nested within a <vertex-viewer>,
   * this property will be populated automatically.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The starting position of this transform widget. This position will be updated
   * as transforms occur. Setting this value to `undefined` will remove the widget.
   */
  @Prop({ mutable: true })
  public position?: Vector3.Vector3;

  /**
   * The controller that is responsible for performing transforms.
   */
  @Prop({ mutable: true })
  public controller?: TransformController;

  /**
   * The color of the translation arrow on the x-axis. Defaults to `#ea3324`.
   */
  @Prop()
  public xArrowColor: Color.Color | string = '#ea3324';

  /**
   * The color of the translation arrow on the y-axis. Defaults to `#4faf32`.
   */
  @Prop()
  public yArrowColor: Color.Color | string = '#4faf32';

  /**
   * The color of the translation arrow on the z-axis. Defaults to `#0000ff`.
   */
  @Prop()
  public zArrowColor: Color.Color | string = '#0000ff';

  /**
   * The color override of the hovered component. Defaults to `#ffff00`.
   */
  @Prop()
  public hoveredColor: Color.Color | string = '#ffff00';

  /**
   * The color to display when persistence of a transform is pending. Defaults to `#cccccc`.
   */
  @Prop()
  public disabledColor: Color.Color | string = '#cccccc';

  /**
   * @internal
   * @ignore
   *
   * Visible for testing.
   */
  @Prop({ mutable: true })
  public hovered?: Mesh;

  private currentPosition?: Vector3.Vector3;

  private widget?: TransformWidget;
  private dragging?: Mesh;
  private lastWorldPosition?: Vector3.Vector3;

  private canvasBounds?: DOMRect;
  private canvasResizeObserver!: ResizeObserver;
  private canvasRef?: HTMLCanvasElement;

  private hoveredChangeDisposable?: Disposable;

  protected componentDidLoad(): void {
    window.addEventListener('pointermove', this.handleWindowPointerMove);

    this.canvasResizeObserver = new ResizeObserver(this.handleCanvasResize);

    if (this.canvasRef != null) {
      this.canvasResizeObserver.observe(this.canvasRef);

      this.setupTransformWidget(this.canvasRef);
    }

    this.handleViewerChanged(this.viewer, undefined);
  }

  protected disconnectedCallback(): void {
    window.removeEventListener('pointermove', this.handleWindowPointerMove);

    this.canvasResizeObserver.disconnect();

    this.hoveredChangeDisposable?.dispose();
    this.widget?.dispose();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleViewerFrameDrawn);
    oldViewer?.removeEventListener(
      'dimensionschange',
      this.handleViewerDimensionsChanged
    );
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener(
      'dimensionschange',
      this.handleViewerDimensionsChanged
    );

    if (newViewer?.stream != null) {
      this.controller?.dispose();
      this.controller = new TransformController(newViewer.stream);
    }
  }

  /**
   * @ignore
   */
  @Watch('position')
  protected handlePositionChanged(): void {
    this.currentPosition = this.position;

    this.getTransformWidget()?.updatePosition(this.currentPosition);

    if (this.position == null) {
      this.controller?.clearTransform();
    }
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <canvas
          ref={(el) => {
            this.canvasRef = el;
          }}
          class={classNames('widget', {
            hovered: this.hovered != null,
          })}
          width={this.viewer?.viewport.width}
          height={this.viewer?.viewport.height}
          onPointerDown={this.handlePointerDown}
        />
      </Host>
    );
  }

  private handleHoveredMeshChanged = (mesh: Mesh | undefined): void => {
    this.hovered = mesh;
  };

  private handleViewerFrameDrawn = (): void => {
    this.updatePropsFromViewer();
  };

  private handleViewerDimensionsChanged = (): void => {
    const canvasRef = this.canvasRef;

    if (canvasRef != null && this.viewer != null && this.viewer.frame != null) {
      const { viewport } = this.viewer;

      writeDOM(() => {
        canvasRef.width = viewport.width;
        canvasRef.height = viewport.height;
      });

      readDOM(() => {
        this.canvasBounds = canvasRef.getBoundingClientRect();
        this.getTransformWidget()?.updateDimensions(canvasRef);
      });
    }
  };

  private handleCanvasResize = (): void => {
    readDOM(() => {
      if (this.canvasRef != null) {
        this.canvasBounds = this.canvasRef?.getBoundingClientRect();

        this.getTransformWidget()?.updateDimensions(this.canvasRef);
      }
    });
  };

  private handleWindowPointerMove = (event: PointerEvent): void => {
    const canvasPoint = convertPointToCanvas(
      Point.create(event.clientX, event.clientY),
      this.getCanvasBounds()
    );
    const widget = this.getTransformWidget();

    if (canvasPoint != null && widget?.boundsContainsPoint(canvasPoint)) {
      widget?.updateCursor(canvasPoint);
    } else {
      widget?.updateCursor(undefined);
      this.hovered = undefined;
    }
  };

  private handlePointerDown = async (event: PointerEvent): Promise<void> => {
    if (this.hovered != null) {
      this.dragging = this.hovered;
      this.lastWorldPosition = convertCanvasPointToWorld(
        convertPointToCanvas(
          Point.create(event.clientX, event.clientY),
          this.getCanvasBounds()
        ),
        this.viewer?.frame,
        this.viewer?.viewport,
        this.currentPosition
      );

      this.controller?.beginTransform();

      window.removeEventListener('pointermove', this.handleWindowPointerMove);
      window.addEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('pointerup', this.handlePointerUp);
    }
  };

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    if (this.dragging != null && this.lastWorldPosition != null) {
      const currentWorld = convertCanvasPointToWorld(
        convertPointToCanvas(
          Point.create(event.clientX, event.clientY),
          this.getCanvasBounds()
        ),
        this.viewer?.frame,
        this.viewer?.viewport,
        this.currentPosition
      );

      this.transform(
        this.lastWorldPosition,
        currentWorld ?? this.lastWorldPosition
      );

      this.lastWorldPosition = currentWorld;
    }
  };

  private handlePointerUp = async (event: PointerEvent): Promise<void> => {
    const canvasPoint = convertPointToCanvas(
      Point.create(event.clientX, event.clientY),
      this.getCanvasBounds()
    );
    const widget = this.getTransformWidget();

    this.dragging = undefined;
    this.lastWorldPosition = undefined;
    this.position = this.currentPosition;

    widget?.updateCursor(canvasPoint);
    widget?.updatePosition(this.currentPosition);
    widget?.updateColors({
      xArrow: this.disabledColor,
      yArrow: this.disabledColor,
      zArrow: this.disabledColor,
      hovered: this.disabledColor,
    });

    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);

    await this.controller?.endTransform();

    window.addEventListener('pointermove', this.handleWindowPointerMove);

    this.getTransformWidget()?.updateColors({
      xArrow: this.xArrowColor,
      yArrow: this.yArrowColor,
      zArrow: this.zArrowColor,
      hovered: this.hoveredColor,
    });
  };

  private updatePropsFromViewer = (): void => {
    const { frame } = this.viewer || {};

    if (frame != null) {
      const widget = this.getTransformWidget();

      widget?.updateFrame(frame, this.dragging == null);
    }
  };

  private transform(previous: Vector3.Vector3, next: Vector3.Vector3): void {
    if (
      this.position != null &&
      this.currentPosition != null &&
      this.dragging != null
    ) {
      this.currentPosition = computeUpdatedPosition(
        this.currentPosition,
        previous,
        next,
        this.dragging.identifier
      );

      this.getTransformWidget()?.updatePosition(this.currentPosition);
      this.controller?.updateTranslation(
        Vector3.subtract(this.currentPosition, this.position)
      );
    }
  }

  private setupTransformWidget = (canvasRef: HTMLCanvasElement): void => {
    this.widget = new TransformWidget(canvasRef, {
      xArrow: this.xArrowColor,
      yArrow: this.yArrowColor,
      zArrow: this.zArrowColor,
      hovered: this.hoveredColor,
    });

    if (this.position != null) {
      this.widget.updatePosition(this.position);
    }
    if (this.viewer?.frame != null) {
      this.widget.updateFrame(this.viewer.frame, true);
    }

    this.hoveredChangeDisposable = this.widget.onHoveredChanged(
      this.handleHoveredMeshChanged
    );
  };

  private getCanvasBounds = (): DOMRect | undefined => {
    if (this.canvasBounds != null) {
      return this.canvasBounds;
    } else if (this.canvasRef != null) {
      this.canvasBounds = this.canvasRef?.getBoundingClientRect();
      return this.canvasBounds;
    }
  };

  private getTransformWidget = (): TransformWidget | undefined => {
    if (this.widget == null && this.canvasRef != null) {
      this.setupTransformWidget(this.canvasRef);
    }

    return this.widget;
  };
}
