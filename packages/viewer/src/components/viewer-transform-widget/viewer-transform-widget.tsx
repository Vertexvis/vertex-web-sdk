import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import {
  Angle,
  Euler,
  Matrix4,
  Point,
  Quaternion,
  Vector3,
} from '@vertexvis/geometry';
import { Color, Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { readDOM, writeDOM } from '../../lib/stencil';
import { TransformController } from '../../lib/transforms/controller';
import { Drawable } from '../../lib/transforms/drawable';
import {
  computeInputPosition,
  computeRotationAxis,
  computeUpdatedTransform,
  convertCanvasPointToWorld,
  convertPointToCanvas,
  PointAndPosition,
} from './util';
import { TransformWidgetInput } from './viewer-transform-widget-components';
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
   * An event that is emitted when the rotation of the widget changes.
   */
  @Event({ bubbles: true })
  public rotationChanged!: EventEmitter<Euler.Euler | undefined>;

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
   * The starting angle for the transform widget. This rotation will be updated
   * as the rotations occur.
   */
  @Prop({ mutable: true })
  public rotation?: Euler.Euler;

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

  @State()
  protected inputPosition?: PointAndPosition;

  @State()
  protected inputValue?: number;

  @Element()
  private hostEl!: HTMLElement;

  private startingTransform?: Matrix4.Matrix4;
  private currentTransform?: Matrix4.Matrix4;
  private dragStartTransform?: Matrix4.Matrix4;

  private xArrowColor: Color.Color | string = '#ea3324';
  private yArrowColor: Color.Color | string = '#4faf32';
  private zArrowColor: Color.Color | string = '#0000ff';
  private hoveredColor: Color.Color | string = '#ffff00';

  private widget?: TransformWidget;
  private lastDragged?: Drawable;
  private dragging?: Drawable;
  private lastAngle = 0;
  private lastWorldPosition?: Vector3.Vector3;
  private lastInputValue?: number;

  private canvasBounds?: DOMRect;
  private canvasResizeObserver?: ResizeObserver;
  private hostStyleObserver?: MutationObserver;
  private canvasRef?: HTMLCanvasElement;

  private hoveredChangeDisposable?: Disposable;

  protected componentDidLoad(): void {
    window.addEventListener('pointermove', this.handlePointerMove);

    this.canvasResizeObserver = new ResizeObserver(this.handleResize);
    this.hostStyleObserver = new MutationObserver(this.handleStyleChange);

    if (this.canvasRef != null) {
      this.canvasResizeObserver.observe(this.canvasRef);

      this.setupTransformWidget(this.canvasRef);
    }

    this.hostStyleObserver.observe(this.hostEl, {
      attributes: true,
      attributeFilter: ['style'],
    });

    this.handleViewerChanged(this.viewer, undefined);
    this.handleStyleChange();
  }

  protected disconnectedCallback(): void {
    window.removeEventListener('pointermove', this.handlePointerMove);

    this.canvasResizeObserver?.disconnect();
    this.hostStyleObserver?.disconnect();

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
  @Watch('xTranslationDisabled')
  @Watch('yTranslationDisabled')
  @Watch('zTranslationDisabled')
  @Watch('xRotationDisabled')
  @Watch('yRotationDisabled')
  @Watch('zRotationDisabled')
  protected handleDisabledPropertyChanged(): void {
    this.widget?.updateDisabledAxis({
      xRotation: this.xRotationDisabled,
      yRotation: this.yRotationDisabled,
      zRotation: this.zRotationDisabled,

      xTranslation: this.xTranslationDisabled,
      yTranslation: this.yTranslationDisabled,
      zTranslation: this.zTranslationDisabled,
    });
  }

  /**
   * @ignore
   */
  @Watch('rotation')
  protected handleRotationChanged(
    newRotation?: Euler.Euler,
    oldRotation?: Euler.Euler
  ): void {
    const rotationToApply = newRotation ?? Euler.create();

    this.currentTransform = this.getTransformForNewRotation(rotationToApply);
    this.startingTransform = this.currentTransform;

    // If the removal of the previous rotation above results in an identity matrix,
    // clear the transformation on the widget to prevent it from appearing at the origin.
    if (
      newRotation == null &&
      this.currentTransform != null &&
      Matrix4.isIdentity(this.currentTransform)
    ) {
      this.currentTransform = undefined;
      this.startingTransform = this.currentTransform;
    }

    this.widget?.updateTransform(this.currentTransform);

    console.debug(
      `Updating widget rotation [previous=${JSON.stringify(
        oldRotation
      )}, current=${JSON.stringify(newRotation)}]`
    );

    this.rotationChanged.emit(newRotation);
  }

  /**
   * @ignore
   */
  @Watch('position')
  protected handlePositionChanged(
    newPosition?: Vector3.Vector3,
    oldPosition?: Vector3.Vector3
  ): void {
    this.currentTransform = this.getTransformForNewPosition(newPosition);
    this.startingTransform = this.currentTransform;

    console.debug(
      `Updating widget position [previous=${JSON.stringify(
        oldPosition
      )}, current=${JSON.stringify(newPosition)}]`
    );
    this.widget?.updateTransform(this.currentTransform);

    if (newPosition == null) {
      this.lastDragged = undefined;
      this.inputPosition = undefined;
      this.controller?.clearTransform();
    }

    this.positionChanged.emit(newPosition);
  }

  public render(): h.JSX.IntrinsicElements {
    console.log(this.inputValue);
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

        {this.inputPosition && this.viewer?.viewport && (
          <TransformWidgetInput
            viewport={this.viewer.viewport}
            point={this.inputPosition.point}
            placement={this.inputPosition.position}
            value={this.inputValue}
            onChange={(value) => {
              console.log(value);

              this.handleInputChange(value);
            }}
          />
        )}
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

  private handleStyleChange = (): void => {
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

      this.getTransformWidget().updateColors({
        xArrow: this.xArrowColor,
        yArrow: this.yArrowColor,
        zArrow: this.zArrowColor,
        hovered: this.hoveredColor,
      });
    });
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

      if (this.dragging.identifier !== this.lastDragged?.identifier) {
        this.dragStartTransform = this.currentTransform;
      }
      this.lastDragged = undefined;

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
      // Begin the transform on the first `pointermove` event as opposed to the
      // `pointerdown` to prevent accidental no-op transforms (identity matrix).
      await this.controller?.beginTransform();

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
        this.updateInputPosition();
        this.updateInputValue();

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
    this.lastDragged = this.dragging;

    this.dragging = undefined;
    this.lastWorldPosition = undefined;
    this.position =
      this.currentTransform != null
        ? Vector3.fromMatrixPosition(this.currentTransform)
        : this.position;
    this.lastAngle = 0;

    this.updateInputPosition();
    this.updateInputValue();

    widget.updateCursor(canvasPoint);
    widget.updateTransform(this.currentTransform);

    widget.updateDisabledAxis({
      xRotation: true,
      yRotation: true,
      zRotation: true,
      xTranslation: true,
      yTranslation: true,
      zTranslation: true,
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

    this.getTransformWidget().updateDisabledAxis({
      xRotation: this.xRotationDisabled,
      yRotation: this.yRotationDisabled,
      zRotation: this.zRotationDisabled,

      xTranslation: this.xTranslationDisabled,
      yTranslation: this.yTranslationDisabled,
      zTranslation: this.zTranslationDisabled,
    });
  };

  private handleInputChange = async (value: number): Promise<void> => {
    if (
      this.viewer?.frame != null &&
      this.lastDragged != null &&
      this.currentTransform != null &&
      this.dragStartTransform != null &&
      this.startingTransform != null &&
      this.lastInputValue != null
    ) {
      const rotation = Matrix4.makeRotation(
        Quaternion.fromMatrixRotation(this.currentTransform)
      );

      switch (this.lastDragged.identifier) {
        case 'x-translate':
          this.currentTransform = Matrix4.multiply(
            this.currentTransform,
            Matrix4.makeTranslation(
              Vector3.transformMatrix(
                Vector3.create(value - this.lastInputValue, 0, 0),
                rotation
              )
            )
          );
          break;
        case 'y-translate':
          this.currentTransform = Matrix4.multiply(
            this.currentTransform,
            Matrix4.makeTranslation(
              Vector3.transformMatrix(
                Vector3.create(0, value - this.lastInputValue, 0),
                rotation
              )
            )
          );
          break;
        case 'z-translate':
          this.currentTransform = Matrix4.multiply(
            this.currentTransform,
            Matrix4.makeTranslation(
              Vector3.transformMatrix(
                Vector3.create(0, 0, value - this.lastInputValue),
                rotation
              )
            )
          );
          break;
        case 'x-rotate':
          this.currentTransform = Matrix4.multiply(
            this.currentTransform,
            Matrix4.makeRotation(
              Quaternion.fromAxisAngle(
                Vector3.left(),
                Angle.toRadians(value - this.lastInputValue)
              )
            )
          );
          break;
        case 'y-rotate':
          this.currentTransform = Matrix4.multiply(
            this.currentTransform,
            Matrix4.makeRotation(
              Quaternion.fromAxisAngle(
                Vector3.down(),
                Angle.toRadians(value - this.lastInputValue)
              )
            )
          );
          break;
        case 'z-rotate':
          this.currentTransform = Matrix4.multiply(
            this.currentTransform,
            Matrix4.makeRotation(
              Quaternion.fromAxisAngle(
                Vector3.forward(),
                Angle.toRadians(value - this.lastInputValue)
              )
            )
          );
          break;
      }

      this.lastInputValue = value;
      await this.controller?.beginTransform();
      this.getTransformWidget().updateTransform(this.currentTransform);
      await this.controller?.updateTransform(
        Matrix4.multiply(
          this.currentTransform,
          Matrix4.invert(this.startingTransform)
        )
      );
      this.updateInputPosition();
      await this.controller?.endTransformDebounced(() => {
        this.position =
          this.currentTransform != null
            ? Vector3.fromMatrixPosition(this.currentTransform)
            : this.position;
      });
    }
  };

  private updatePropsFromViewer = (): void => {
    const { frame } = this.viewer || {};

    if (frame != null) {
      const widget = this.getTransformWidget();

      widget.updateFrame(frame, this.dragging == null);
      this.updateInputPosition();
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
    });

    if (this.rotation != null) {
      this.currentTransform = this.getTransformForNewRotation(this.rotation);
      this.startingTransform = this.currentTransform;
      this.widget.updateTransform(this.currentTransform);
    }

    if (this.position != null) {
      this.currentTransform = this.getTransformForNewPosition(this.position);
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

  private updateInputValue = (): void => {
    const dragging = this.dragging ?? this.lastDragged;
    if (
      dragging != null &&
      this.currentTransform != null &&
      this.dragStartTransform != null
    ) {
      const diff = Matrix4.multiply(
        this.currentTransform,
        Matrix4.invert(this.dragStartTransform)
      );
      const rotation = Matrix4.makeRotation(
        Quaternion.fromMatrixRotation(this.currentTransform)
      );
      const translationDiff = Vector3.transformMatrix(
        // Vector3.negate(Vector3.fromMatrixPosition(diff)),
        Vector3.fromMatrixPosition(diff),
        rotation
      );
      const rotationDiff = Euler.fromRotationMatrix(Matrix4.invert(diff));
      const rotationDiff2 = Euler.fromRotationMatrix(
        Matrix4.multiply(rotation, Matrix4.invert(diff))
      );

      this.lastInputValue = this.inputValue;

      console.log(rotationDiff2);

      switch (dragging.identifier) {
        case 'x-translate':
          this.inputValue = translationDiff.x;
          break;
        case 'y-translate':
          this.inputValue = translationDiff.y;
          break;
        case 'z-translate':
          this.inputValue = translationDiff.z;
          break;
        case 'x-rotate': {
          const rotationAxis = Vector3.transformMatrix(
            Vector3.right(),
            rotation
          );

          const angle =
            rotationAxis.x * rotationDiff.x +
            rotationAxis.y * rotationDiff.y +
            rotationAxis.z * rotationDiff.z;

          this.inputValue = Angle.toDegrees(angle);
          break;
        }
        case 'y-rotate': {
          const rotationAxis = Vector3.transformMatrix(Vector3.up(), rotation);

          const angle =
            rotationAxis.x * rotationDiff.x +
            rotationAxis.y * rotationDiff.y +
            rotationAxis.z * rotationDiff.z;

          this.inputValue = Angle.toDegrees(angle);
          break;
        }
        case 'z-rotate': {
          const rotationAxis = Vector3.transformMatrix(
            Vector3.back(),
            rotation
          );

          const angle =
            rotationAxis.x * rotationDiff.x +
            rotationAxis.y * rotationDiff.y +
            rotationAxis.z * rotationDiff.z;

          this.inputValue = Angle.toDegrees(angle);
          break;
        }
      }
    }
  };

  private updateInputPosition = (): void => {
    const widget = this.getTransformWidget();
    const widgetBounds = widget.getFullBounds();
    const dragging = this.dragging ?? this.lastDragged;
    if (
      this.viewer?.frame != null &&
      this.position != null &&
      dragging != null &&
      widgetBounds != null
    ) {
      this.inputPosition = computeInputPosition(
        this.viewer.frame,
        this.viewer.viewport,
        widgetBounds,
        this.position,
        dragging.points.toArray()
      );

      // this.lastDragEndPosition = computeInputPosition(
      //   this.viewer.frame,
      //   this.viewer.viewport,
      //   widgetBoundingBox,
      //   this.position,
      //   previousDragging.points.toWorldArray()
      // );
    }
  };

  private getTransformForNewPosition = (
    newPosition?: Vector3.Vector3
  ): Matrix4.Matrix4 | undefined => {
    if (newPosition != null) {
      const c =
        this.currentTransform != null
          ? this.currentTransform
          : Matrix4.makeIdentity();

      const currentRotation = Matrix4.makeRotation(
        Quaternion.fromMatrixRotation(c)
      );
      const position = Matrix4.makeTranslation(newPosition);

      return Matrix4.multiply(position, currentRotation);
    }
  };

  private getTransformForNewRotation = (
    newRotationEuler: Euler.Euler
  ): Matrix4.Matrix4 | undefined => {
    const c =
      this.currentTransform != null
        ? this.currentTransform
        : Matrix4.makeIdentity();

    const oldRotation = Matrix4.invert(
      Matrix4.makeRotation(Quaternion.fromMatrixRotation(c))
    );

    const newRotation = Matrix4.makeRotation(
      Quaternion.fromEuler(newRotationEuler)
    );
    const oldTranslation = Matrix4.multiply(c, oldRotation);

    return Matrix4.multiply(oldTranslation, newRotation);
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
