import {
  Component,
  Element,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Prop,
  State,
} from '@stencil/core';
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { Viewport } from '../..';
import { isTextPinEntity, Pin } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import { translatePointToScreen } from '../viewer-markup/utils';

interface ComputedPoints {
  pinPoint: Point.Point;
  labelPoint: Point.Point;
}
@Component({
  tag: 'vertex-viewer-annotations-pin-group',
  styleUrl: 'vertex-annotations-pin-group.css',
  shadow: false,
})
export class ViewerAnnotationsPinGroup {
  @Element()
  private hostEl!: HTMLElement;

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
   * The model that contains the entities and outcomes from performing pin annotations
   */
  @Prop()
  public pinModel: PinModel = new PinModel();

  @State()
  private invalidateStateCounter = 0;

  private labelEl: HTMLVertexViewerAnnotationsPinLabelElement | undefined;

  protected componentDidLoad(): void {
    this.setLabelObserver();
  }

  protected render(): JSX.Element {
    const computed = this.computeLabelLinePoint();

    if (computed == null || this.pin == null) {
      throw new Error('Unable to draw pin');
    }

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
        >
          {isTextPinEntity(this.pin) && (
            <div
              id="pin-anchor"
              class="pin-anchor"
              onPointerDown={(event) => console.log('pointer: ', event)}
            ></div>
          )}
          {/* todo add regular pin here */}
        </vertex-viewer-dom-element>

        <vertex-viewer-annotations-pin-label-line
          pin={this.pin}
          pinPoint={pinPoint}
          labelPoint={labelPoint}
        ></vertex-viewer-annotations-pin-label-line>

        <vertex-viewer-annotations-pin-label
          pin={this.pin}
          ref={(el) => {
            console.log('setting label: ', el);
            this.labelEl = el;
          }}
          dimensions={this.dimensions}
          pinModel={this.pinModel}
        ></vertex-viewer-annotations-pin-label>
      </vertex-viewer-dom-group>
    );
  }

  private invalidateState(): void {
    this.invalidateStateCounter = this.invalidateStateCounter + 1;
  }

  private setLabelObserver(): void {
    if (this.labelEl != null) {
      const resize = new ResizeObserver(() => this.invalidateState());

      resize.observe(this.labelEl);
    }
  }

  private computeLabelLinePoint(): ComputedPoints | undefined {
    const screenPosition =
      isTextPinEntity(this.pin) && this.pin.labelPoint != null
        ? translatePointToScreen(this.pin.labelPoint, this.dimensions)
        : undefined;

    if (screenPosition && this.pin != null) {
      const pinPoint = this.getFromWorldPosition(
        this.pin.worldPosition,
        this.projectionViewMatrix,
        this.dimensions
      ); // todo return this as well so I dont have to compute it again.

      const label = this.labelEl?.querySelector(`#pin-label-${this.pin?.id}`);
      const labelWidth = label?.clientWidth || 0;
      const labelHeight = label?.clientHeight || 0;
      const topPoint = {
        x: screenPosition.x + labelWidth / 2,
        y: screenPosition.y,
      };

      const bottomPoint = {
        x: screenPosition.x + labelWidth / 2,
        y: screenPosition.y + labelHeight,
      };

      const rightPoint = {
        x: screenPosition.x + labelWidth,
        y: screenPosition.y + labelHeight / 2,
      };

      const leftPoint = {
        x: screenPosition.x,
        y: screenPosition.y + labelHeight / 2,
      };

      const candidates = [topPoint, bottomPoint, leftPoint, rightPoint];

      const distances = candidates.map((candidate) =>
        Point.distance(candidate, pinPoint)
      );

      const candidateIndex = distances.indexOf(Math.min(...distances));

      return {
        pinPoint,
        labelPoint: candidates[candidateIndex],
      };
    }
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
