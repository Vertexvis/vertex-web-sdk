import {
  Component,
  Fragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Prop,
  State,
} from '@stencil/core';
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import classNames from 'classnames';

import { Viewport } from '../..';
import { PinController } from '../../lib/pins/controller';
import { isDefaultPin, isTextPin, Pin } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import { translatePointToScreen } from '../viewer-markup/utils';
import { getClosestCenterToPoint } from './utils';

interface ComputedPoints {
  pinPoint: Point.Point;
  labelPoint?: Point.Point;
}
@Component({
  tag: 'vertex-viewer-pin-group',
  styleUrl: 'vertex-pin-group.css',
  shadow: false,
})
export class ViewerPinGroup {
  /**
   * The pin to draw for the group
   */
  @Prop({ mutable: true })
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
  public dimensions: Dimensions.Dimensions = { height: 0, width: 0 };

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
   * Whether or not the pin is "selected"
   */
  @Prop()
  public selected = false;

  @State()
  private invalidateStateCounter = 0;

  private labelEl: HTMLVertexViewerPinLabelElement | undefined;

  protected componentDidLoad(): void {
    this.setLabelObserver();
  }

  protected render(): JSX.Element {
    if (this.pin == null) {
      throw new Error('Unable to draw pin');
    }
    const computed = this.computeLabelLinePoint(this.pin);

    const { pinPoint, labelPoint } = computed;

    return (
      <vertex-viewer-dom-group
        id={`pin-group-${this.pin?.id}`}
        data-testid={`pin-group-${this.pin.id}`}
      >
        <vertex-viewer-dom-element
          key={`drawn-pin-${this.pin.id}`}
          data-testid={`drawn-pin-${this.pin.id}`}
          position={this.pin.worldPosition}
          onPointerDown={(e) => {
            e.stopPropagation();

            this.pinController?.setSelectedPinId(this.pin?.id);
          }}
        >
          {isTextPin(this.pin) && (
            <div
              id="pin-anchor"
              class={classNames('pin-anchor', { selected: this.selected })}
            ></div>
          )}

          {isDefaultPin(this.pin) && (
            <vertex-viewer-icon
              name="pin-fill"
              size="lg"
              class={classNames('pin', {
                'pin-selected': this.selected,
              })}
            />
          )}
        </vertex-viewer-dom-element>

        {isTextPin(this.pin) && (
          <Fragment>
            <vertex-viewer-pin-label-line
              id={`pin-label-line-${this.pin?.id}`}
              pinPoint={pinPoint}
              labelPoint={labelPoint}
            ></vertex-viewer-pin-label-line>

            <vertex-viewer-pin-label
              pin={this.pin}
              ref={(el) => {
                this.labelEl = el;
              }}
              dimensions={this.dimensions}
              pinController={this.pinController}
            ></vertex-viewer-pin-label>
          </Fragment>
        )}
      </vertex-viewer-dom-group>
    );
  }

  private invalidateState(): void {
    this.invalidateStateCounter = this.invalidateStateCounter + 1;
  }

  private setLabelObserver(): void {
    const label = this.labelEl?.addEventListener('labelChanged', () => {
      this.invalidateState();
    });

    if (label != null) {
      const resize = new ResizeObserver(() => this.invalidateState());

      resize.observe(label);
    }
  }

  private computeLabelLinePoint(pin: Pin): ComputedPoints {
    const pinPoint = this.getFromWorldPosition(
      pin.worldPosition,
      this.projectionViewMatrix,
      this.dimensions
    );
    const screenPosition =
      isTextPin(this.pin) && this.pin.attributes.labelPoint != null
        ? translatePointToScreen(
            this.pin.attributes.labelPoint,
            this.dimensions
          )
        : undefined;

    if (screenPosition && pinPoint != null) {
      const label = this.labelEl?.querySelector(`#pin-label-${this.pin?.id}`);

      const labelWidth = label?.clientWidth || 0;
      const labelHeight = label?.clientHeight || 0;

      return {
        pinPoint,
        labelPoint: getClosestCenterToPoint(screenPosition, pinPoint, {
          width: labelWidth,
          height: labelHeight,
        }),
      };
    }

    return {
      pinPoint,
    };
  }

  private getFromWorldPosition(
    pt: Vector3.Vector3,
    projectionViewMatrix: Matrix4.Matrix4,
    dimensions: Dimensions.Dimensions
  ): Point.Point {
    const ndcPt = Vector3.transformMatrix(pt, projectionViewMatrix);
    return Viewport.fromDimensions(dimensions).transformVectorToViewport(ndcPt);
  }
}
