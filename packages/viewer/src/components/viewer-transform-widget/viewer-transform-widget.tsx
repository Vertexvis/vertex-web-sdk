import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { Point, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { readDOM } from '../../lib/__mocks__/stencil';
import { writeDOM } from '../../lib/stencil';
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
   *
   * @internal
   * @private
   */
  @Prop({ mutable: true })
  public currentPosition?: Vector3.Vector3;

  /**
   * The controller that is responsible for performing transforms.
   */
  @Prop({ mutable: true })
  public controller?: TransformController;

  @State()
  private hovered?: Mesh;

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

      this.setupTransformWidget();
    }
  }

  protected disconnectedCallback(): void {
    window.removeEventListener('pointermove', this.handleWindowPointerMove);

    this.canvasResizeObserver.disconnect();

    this.hoveredChangeDisposable?.dispose();
  }

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

    if (this.canvasRef != null && newViewer != null) {
      this.canvasRef.width = newViewer.clientWidth;
      this.canvasRef.height = newViewer.clientHeight;
    }
  }

  @Watch('position')
  protected handlePositionChanged(): void {
    this.currentPosition = this.position;

    if (this.position == null) {
      this.controller?.clearTransform();
    }
  }

  @Watch('currentPosition')
  protected handleCurrentPositionChanged(): void {
    const widget = this.getTransformWidget();

    widget?.updatePosition(this.currentPosition);
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

  private handlePointerUp = (event: PointerEvent): void => {
    const canvasPoint = convertPointToCanvas(
      Point.create(event.clientX, event.clientY),
      this.canvasBounds
    );

    this.dragging = undefined;
    this.lastWorldPosition = undefined;
    this.position = this.currentPosition;

    this.widget?.updateCursor(canvasPoint);
    this.controller?.endTransform();

    window.addEventListener('pointermove', this.handleWindowPointerMove);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
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
        this.dragging
      );

      this.controller?.updateTranslation(
        Vector3.subtract(this.currentPosition, this.position)
      );
    }
  }

  private setupTransformWidget = (): void => {
    if (this.canvasRef != null) {
      this.widget = new TransformWidget(this.canvasRef);

      this.hoveredChangeDisposable = this.widget.onHoveredChanged(
        this.handleHoveredMeshChanged
      );
    }
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
      this.setupTransformWidget();
    }

    return this.widget;
  };
}
