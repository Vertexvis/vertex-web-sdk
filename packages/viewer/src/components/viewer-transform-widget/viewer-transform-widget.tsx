import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  Watch,
} from '@stencil/core';
import { Angle, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { Color, Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { readDOM, writeDOM } from '../../lib/stencil';
import { TransformController } from '../../lib/transforms/controller';
import { Drawable } from '../../lib/transforms/drawable';
import {
  computeUpdatedTransform,
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
   * An event that is emitted when the position of the widget changes.
   */
  @Event({ bubbles: true })
  public positionChanged!: EventEmitter<Vector3.Vector3 | undefined>;

  /**
   * An event that is emitted when the interaction has ended
   */
  @Event({ bubbles: true })
  public interactionEnded!: EventEmitter<Matrix4.Matrix4 | undefined>;

  /**
   * An event that is emitted an interaction with the widget has started
   */
  @Event({ bubbles: true })
  public interactionStarted!: EventEmitter<void>;

  /**
   * The viewer to connect to transforms. If nested within a <vertex-viewer>,
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
   * Determines whether or not the x-rotation is disabled on the widget
   */
  @Prop({ mutable: true })
  public xRotationDisabled = false;

  /**
   * Determines whether or not the y-rotation is disabled on the widget
   */
  @Prop({ mutable: true })
  public yRotationDisabled = false;

  /**
   * Determines whether or not the z-rotation is disabled on the widget
   */
  @Prop({ mutable: true })
  public zRotationDisabled = false;

  /**
   * Determines whether or not the x-translation is disabled on the widget
   */
  @Prop({ mutable: true })
  public xTranslationDisabled = false;

  /**
   * Determines whether or not the y-translation is disabled on the widget
   */
  @Prop({ mutable: true })
  public yTranslationDisabled = false;

  /**
   * Determines whether or not the z-translation is disabled on the widget
   */
  @Prop({ mutable: true })
  public zTranslationDisabled = false;

  /**
   * @internal
   * @ignore
   *
   * Visible for testing.
   */
  @Prop({ mutable: true })
  public hovered?: Drawable;

  @Element()
  private hostEl!: HTMLElement;

  private startingTransform?: Matrix4.Matrix4;
  private currentTransform?: Matrix4.Matrix4;

  private xArrowColor: Color.Color | string = '#ea3324';
  private yArrowColor: Color.Color | string = '#4faf32';
  private zArrowColor: Color.Color | string = '#0000ff';
  private hoveredColor: Color.Color | string = '#ffff00';
  private disabledColor: Color.Color | string = '#cccccc';

  private widget?: TransformWidget;
  private dragging?: Drawable;
  private lastAngle = 0;
  private lastWorldPosition?: Vector3.Vector3;

  private canvasBounds?: DOMRect;
  private canvasResizeObserver?: ResizeObserver;
  private canvasRef?: HTMLCanvasElement;

  private hoveredChangeDisposable?: Disposable;

  protected componentDidLoad(): void {
    window.addEventListener('pointermove', this.handlePointerMove);

    this.canvasResizeObserver = new ResizeObserver(this.handleResize);

    if (this.canvasRef != null) {
      this.canvasResizeObserver.observe(this.canvasRef);

      this.setupTransformWidget(this.canvasRef);
    }

    this.handleViewerChanged(this.viewer, undefined);

    readDOM(() => {
      const hostStyles = window.getComputedStyle(this.hostEl);

      this.xArrowColor = hostStyles
        .getPropertyValue('--viewer-transform-widget-x-axis-arrow-color')
        .trim();
      this.yArrowColor = hostStyles
        .getPropertyValue('--viewer-transform-widget-y-axis-arrow-color')
        .trim();
      this.zArrowColor = hostStyles
        .getPropertyValue('--viewer-transform-widget-z-axis-arrow-color')
        .trim();
      this.hoveredColor = hostStyles
        .getPropertyValue('--viewer-transform-widget-hovered-arrow-color')
        .trim();
      this.disabledColor = hostStyles
        .getPropertyValue('--viewer-transform-widget-disabled-arrow-color')
        .trim();
    });
  }

  protected disconnectedCallback(): void {
    window.removeEventListener('pointermove', this.handlePointerMove);

    this.canvasResizeObserver?.disconnect();

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
      this.handleViewerDimensionsChange
    );
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener(
      'dimensionschange',
      this.handleViewerDimensionsChange
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
  protected handlePositionChanged(
    newPosition?: Vector3.Vector3,
    oldPosition?: Vector3.Vector3
  ): void {
    this.currentTransform = this.getTransform(oldPosition, newPosition);
    this.startingTransform = this.currentTransform;

    console.debug(
      `Updating widget position [previous=${JSON.stringify(
        oldPosition
      )}, current=${JSON.stringify(newPosition)}]`
    );
    this.widget?.updateTransform(this.currentTransform);

    if (newPosition == null) {
      this.controller?.clearTransform();
    }

    this.positionChanged.emit(newPosition);
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
          onPointerDown={this.handleBeginDrag}
        />
      </Host>
    );
  }

  private handleHoveredDrawableChanged = (drawable?: Drawable): void => {
    this.hovered = drawable;
  };

  private handleViewerFrameDrawn = (): void => {
    this.updatePropsFromViewer();
  };

  private handleViewerDimensionsChange = (): void => {
    writeDOM(() => {
      if (this.viewer != null && this.canvasRef != null) {
        this.canvasRef.width = this.viewer.viewport.width;
        this.canvasRef.height = this.viewer.viewport.height;

        this.updateCanvasBounds(this.canvasRef);
      }
    });
  };

  private handleResize = (): void => {
    if (this.canvasRef != null) {
      this.updateCanvasBounds(this.canvasRef);
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.dragging == null) {
      const canvasPoint = convertPointToCanvas(
        Point.create(event.clientX, event.clientY),
        this.getCanvasBounds()
      );
      const widget = this.getTransformWidget();

      if (canvasPoint != null && widget.boundsContainsPoint(canvasPoint)) {
        widget.updateCursor(canvasPoint);
      } else {
        widget.updateCursor(undefined);
        this.hovered = undefined;
      }
    }
  };

  private handleBeginDrag = async (event: PointerEvent): Promise<void> => {
    const canvasBounds = this.getCanvasBounds();

    if (
      this.hovered != null &&
      canvasBounds != null &&
      this.viewer != null &&
      this.position != null &&
      this.viewer.frame != null
    ) {
      this.dragging = this.hovered;

      const currentCanvas = convertPointToCanvas(
        Point.create(event.clientX, event.clientY),
        canvasBounds
      );
      const widgetCenter = this.viewer.viewport.transformWorldToViewport(
        this.position,
        this.viewer.frame.scene.camera.projectionViewMatrix
      );

      this.lastAngle =
        currentCanvas != null
          ? Angle.fromPoints(widgetCenter, currentCanvas)
          : 0;

      this.lastWorldPosition = convertCanvasPointToWorld(
        currentCanvas,
        this.viewer?.frame,
        this.viewer?.viewport,
        this.currentTransform
      );

      this.controller?.beginTransform();
      this.interactionStarted.emit();

      window.removeEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('pointermove', this.handleDrag);
      window.addEventListener('pointerup', this.handleEndTransform);
    }
  };

  private handleDrag = async (event: PointerEvent): Promise<void> => {
    // Prevent selection of text and interaction with view cube while dragging the widget
    event.preventDefault();

    const canvasBounds = this.getCanvasBounds();

    if (
      this.dragging != null &&
      this.lastWorldPosition != null &&
      canvasBounds != null &&
      this.viewer != null &&
      this.viewer.frame != null &&
      this.position != null
    ) {
      const currentCanvas = convertPointToCanvas(
        Point.create(event.clientX, event.clientY),
        canvasBounds
      );
      const widgetCenter = this.viewer.viewport.transformWorldToViewport(
        this.position,
        this.viewer.frame.scene.camera.projectionViewMatrix
      );

      const currentWorld = convertCanvasPointToWorld(
        currentCanvas,
        this.viewer?.frame,
        this.viewer?.viewport,
        this.currentTransform
      );

      if (
        currentWorld != null &&
        currentCanvas != null &&
        widgetCenter != null
      ) {
        const angle = Angle.fromPoints(widgetCenter, currentCanvas);

        this.transform(
          this.lastWorldPosition,
          currentWorld,
          angle - this.lastAngle
        );

        this.lastWorldPosition = currentWorld;
        this.lastAngle = angle;
      }
    }
  };

  private handleEndTransform = async (event: PointerEvent): Promise<void> => {
    const canvasPoint = convertPointToCanvas(
      Point.create(event.clientX, event.clientY),
      this.getCanvasBounds()
    );
    const widget = this.getTransformWidget();

    this.dragging = undefined;
    this.lastWorldPosition = undefined;
    this.position =
      this.currentTransform != null
        ? Vector3.fromMatrixPosition(this.currentTransform)
        : this.position;
    this.lastAngle = 0;

    widget.updateCursor(canvasPoint);
    widget.updateTransform(this.currentTransform);
    widget.updateColors({
      xArrow: this.disabledColor,
      yArrow: this.disabledColor,
      zArrow: this.disabledColor,
      hovered: this.disabledColor,
    });

    window.removeEventListener('pointermove', this.handleDrag);
    window.removeEventListener('pointerup', this.handleEndTransform);

    try {
      const delta = this.controller?.getCurrentDelta();

      await this.controller?.endTransform();

      this.interactionEnded.emit(delta);
    } catch (e) {
      console.error('Failed to end transform interaction', e);
    }

    window.addEventListener('pointermove', this.handlePointerMove);

    this.getTransformWidget().updateColors({
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

      widget.updateFrame(frame, this.dragging == null);
    }
  };

  private transform(
    previous: Vector3.Vector3,
    next: Vector3.Vector3,
    angle: number
  ): void {
    if (
      this.position != null &&
      this.startingTransform != null &&
      this.currentTransform != null &&
      this.dragging != null &&
      this.viewer != null &&
      this.viewer.frame != null
    ) {
      this.currentTransform = computeUpdatedTransform(
        this.currentTransform,
        previous,
        next,
        this.viewer?.frame.scene.camera.viewVector,
        angle,
        this.dragging.identifier
      );

      this.getTransformWidget().updateTransform(this.currentTransform);
      this.controller?.updateTransform(
        Matrix4.multiply(
          this.currentTransform,
          Matrix4.invert(this.startingTransform)
        )
      );
    }
  }

  private handleSettingDisabledAxis(): void {
    if (this.widget) {
      this.widget.updateDisabledAxis({
        xRotation: this.xRotationDisabled,
        yRotation: this.yRotationDisabled,
        zRotation: this.zRotationDisabled,
        xTranslation: this.xTranslationDisabled,
        yTranslation: this.yTranslationDisabled,
        zTranslation: this.zTranslationDisabled,
      });
    } else {
      console.warn('Cannot set disabled values - no widget defined');
    }
  }

  private setupTransformWidget = (
    canvasRef: HTMLCanvasElement
  ): TransformWidget => {
    console.debug(
      `Initializing transform widget. [initial-position=${JSON.stringify(
        this.position
      )}, has-initial-frame=${this.viewer?.frame != null}]`
    );

    this.widget = new TransformWidget(canvasRef, {
      xArrow: this.xArrowColor,
      yArrow: this.yArrowColor,
      zArrow: this.zArrowColor,
      hovered: this.hoveredColor,
      disabledColor: this.disabledColor,
    });

    if (this.position != null) {
      this.currentTransform = Matrix4.makeTranslation(this.position);
      this.startingTransform = this.currentTransform;
      this.widget.updateTransform(this.currentTransform);
    }
    if (this.viewer?.frame != null) {
      this.widget.updateFrame(this.viewer.frame, true);
    }

    this.handleSettingDisabledAxis();

    this.hoveredChangeDisposable = this.widget.onHoveredChanged(
      this.handleHoveredDrawableChanged
    );

    return this.widget;
  };

  private updateCanvasBounds = (canvasElement: HTMLCanvasElement): void => {
    readDOM(() => {
      this.canvasBounds = canvasElement.getBoundingClientRect();

      this.getTransformWidget().updateDimensions(canvasElement);
    });
  };

  private getTransform = (
    oldPosition?: Vector3.Vector3,
    newPosition?: Vector3.Vector3
  ): Matrix4.Matrix4 | undefined => {
    if (oldPosition != null && newPosition != null) {
      const currentTransformAsObject =
        this.currentTransform != null
          ? Matrix4.toObject(this.currentTransform)
          : Matrix4.toObject(Matrix4.makeIdentity());

      // Maintain existing rotation, but update the position
      // treating it as a global position, rather than applying
      // the existing rotation to the new position.
      return Matrix4.fromObject({
        ...currentTransformAsObject,
        m14: newPosition.x,
        m24: newPosition.y,
        m34: newPosition.z,
      });
    } else if (newPosition != null) {
      return Matrix4.makeTranslation(newPosition);
    }
  };

  private getCanvasBounds = (): DOMRect | undefined => {
    if (this.canvasBounds != null) {
      return this.canvasBounds;
    } else if (this.canvasRef != null) {
      this.updateCanvasBounds(this.canvasRef);
      return this.canvasBounds;
    }
  };

  private getTransformWidget = (): TransformWidget => {
    if (this.widget == null && this.canvasRef != null) {
      return this.setupTransformWidget(this.canvasRef);
    } else if (this.widget != null) {
      return this.widget;
    } else {
      throw new Error(
        'Transform widget was not initialized. The canvas element may not have been initialized.'
      );
    }
  };
}
