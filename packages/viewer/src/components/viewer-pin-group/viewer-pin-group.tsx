import {
  Component,
  Fragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { Viewport } from '../..';
import { PinController } from '../../lib/pins/controller';
import { isTextPin, Pin, TextPin } from '../../lib/pins/model';
import { PinModel } from '../../lib/pins/model';
import { DepthBuffer } from '../../lib/types';
import { translatePointToScreen } from '../viewer-pin-tool/utils';
import { PinRenderer } from './pin-renderer';
import { getClosestCenterToPoint } from './utils';

interface ComputedPoints {
  pinPoint: Point.Point;
  labelPoint?: Point.Point;
}

@Component({
  tag: 'vertex-viewer-pin-group',
  styleUrl: 'viewer-pin-group.css',
  shadow: false,
})
export class ViewerPinGroup {
  /**
   * The pin to draw for the group
   */
  @Prop()
  public pin?: Pin;

  /**
   * The local matrix of this element.
   */
  @Prop({ mutable: true, attribute: null })
  public matrix: Matrix4.Matrix4 = Matrix4.makeIdentity();

  /**
   * Projection view matrix used for computing the position of the pin line
   */
  @Prop()
  public projectionViewMatrix: Matrix4.Matrix4 = Matrix4.makeIdentity();

  /**
   * The dimensions of the canvas for the pins
   */
  @Prop({ mutable: true })
  public elementBounds?: DOMRect;

  /**
   * The model that contains the entities and outcomes from performing pin operations
   */
  @Prop()
  public pinModel: PinModel = new PinModel();

  /**
   * The controller that drives behavior for pin operations
   */
  @Prop()
  public pinController?: PinController;

  /**
   * Whether the pin is "selected"
   */
  @Prop()
  public selected = false;

  /**
   * @internal
   * Whether the pin is occluded
   */
  @Prop({ mutable: true })
  public occluded = false;

  /**
   * The current depth buffer of the frame.
   *
   * This property will automatically be set when supplying a viewer to the
   * component, or when added as a child to `<vertex-viewer>`.
   */
  @Prop({ mutable: true })
  public depthBuffer?: DepthBuffer;

  /**
   * The viewer synced to this renderer.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @State()
  private invalidateStateCounter = 0;

  private labelEl: HTMLVertexViewerPinLabelElement | undefined;

  private resizeObserver?: ResizeObserver;

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.handleViewerChange(this.viewer, undefined);

    if (this.viewer?.frame != null) {
      this.handleViewerFrameDrawn();
    }
  }

  protected componentDidLoad(): void {
    this.setLabelObserver();

    if (this.pinController == null) {
      this.pinController = new PinController(this.pinModel);
    }

    if (this.selected) {
      this.labelEl?.setFocus();
    }
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChange(
    newViewer: HTMLVertexViewerElement | undefined,
    oldViewer: HTMLVertexViewerElement | undefined
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);
  }

  /**
   * @ignore
   */
  @Watch('depthBuffer')
  protected handleDepthBufferChange(): void {
    if (this.depthBuffer != null && this.pin != null && this.viewer != null) {
      const isOccluded = this.depthBuffer.isOccluded(
        this.pin.worldPosition,
        this.viewer.viewport
      );
      console.log('isOccluded: ' + isOccluded);
      this.occluded = isOccluded;

      const newWorldPoint = this.depthBuffer.pointTest(
        this.pin.worldPosition,
        this.viewer.viewport
      );

      const indicator = document.querySelector(
        '#indicator'
      ) as HTMLVertexViewerHitResultIndicatorElement;

      if (indicator != null) {
        indicator.position = newWorldPoint;
        indicator.normal = Vector3.forward();
      } else {
        const created = document.createElement(
          'vertex-viewer-hit-result-indicator'
        );
        created.id = 'indicator';
        created.position = newWorldPoint;
        created.normal = Vector3.forward();
        this.viewer.appendChild(created);
      }
    }
  }

  protected disconnectedCallback(): void {
    this.labelEl?.removeEventListener('labelChanged', this.invalidateState);
    this.resizeObserver?.disconnect();
  }

  protected render(): JSX.Element {
    if (this.pin == null) {
      throw new Error('Unable to draw pin');
    }

    const { pinPoint, labelPoint } = this.computePinPoints(this.pin);

    return (
      <Fragment>
        <vertex-viewer-dom-element
          data-testid={`drawn-pin-${this.pin.id}`}
          position={this.pin.worldPosition}
          onPointerDown={(e) => {
            if (e.buttons !== 2) {
              e.stopPropagation();
            }

            this.selectPin();
            this.handleAnchorPointerDown();
          }}
        >
          <PinRenderer
            pin={this.pin}
            selected={this.selected}
            occluded={this.occluded}
          />
        </vertex-viewer-dom-element>

        {isTextPin(this.pin) && !this.occluded && (
          <Fragment>
            <vertex-viewer-pin-label-line
              id={`pin-label-line-${this.pin?.id}`}
              pinPoint={pinPoint}
              pin={this.pin}
              labelPoint={labelPoint}
              onPointerDown={() => this.selectPin()}
            ></vertex-viewer-pin-label-line>

            <vertex-viewer-pin-label
              pin={this.pin}
              ref={(el) => (this.labelEl = el)}
              elementBounds={this.elementBounds}
              pinController={this.pinController}
              onPointerDown={() => this.selectPin()}
            ></vertex-viewer-pin-label>
          </Fragment>
        )}
      </Fragment>
    );
  }

  private invalidateState = (): void => {
    this.invalidateStateCounter = this.invalidateStateCounter + 1;
  };

  private setLabelObserver(): void {
    if (this.labelEl != null) {
      this.labelEl.addEventListener('labelChanged', this.invalidateState);

      this.resizeObserver = new ResizeObserver(() => this.invalidateState());
      this.resizeObserver.observe(this.labelEl);
    }
  }

  private computePinPoints(pin: Pin): ComputedPoints {
    if (this.elementBounds != null && this.pin != null) {
      return isTextPin(this.pin) && this.pin.label.point != null
        ? this.computeTextPinPoints(this.pin, this.elementBounds)
        : this.computeDefaultPinPoints(this.pin, this.elementBounds);
    }

    return { pinPoint: pin.worldPosition };
  }

  private computeDefaultPinPoints(
    pin: Pin,
    elementBounds: DOMRect
  ): ComputedPoints {
    return {
      pinPoint: this.getFromWorldPosition(
        pin.worldPosition,
        this.projectionViewMatrix,
        elementBounds
      ),
    };
  }

  private computeTextPinPoints(
    pin: TextPin,
    elementBounds: DOMRect
  ): ComputedPoints {
    const { pinPoint } = this.computeDefaultPinPoints(pin, elementBounds);

    const screenPosition = translatePointToScreen(
      pin.label.point,
      elementBounds
    );

    const labelWidth = this.labelEl?.firstElementChild?.clientWidth || 0;
    const labelHeight = this.labelEl?.firstElementChild?.clientHeight || 0;

    return {
      pinPoint,
      labelPoint: getClosestCenterToPoint(screenPosition, pinPoint, {
        width: labelWidth,
        height: labelHeight,
      }),
    };
  }

  private handleAnchorPointerDown(): void {
    if (
      this.elementBounds != null &&
      this.pinController?.getToolMode() === 'edit' &&
      this.pin != null
    ) {
      this.pinController?.setDraggable({ id: this.pin.id });
    }
  }

  private selectPin(): void {
    this.pinController?.setSelectedPinId(this.pin?.id);
  }

  private getFromWorldPosition(
    pt: Vector3.Vector3,
    projectionViewMatrix: Matrix4.Matrix4,
    dimensions: Dimensions.Dimensions
  ): Point.Point {
    const ndcPt = Vector3.transformMatrix(pt, projectionViewMatrix);
    return Viewport.fromDimensions(dimensions).transformVectorToViewport(ndcPt);
  }

  private handleViewerFrameDrawn = async (): Promise<void> => {
    const { frame } = this.viewer || {};
    this.depthBuffer = await frame?.depthBuffer();
  };
}
