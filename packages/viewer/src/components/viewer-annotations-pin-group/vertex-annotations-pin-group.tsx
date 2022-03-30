import {
  Component,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Prop,
} from '@stencil/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { Viewport } from '../..';
import { Pin } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import { translatePointToScreen } from '../viewer-markup/utils';

@Component({
  tag: 'vertex-viewer-annotations-pin-group',
  styleUrl: 'vertex-annotations-pin-group.css',
  shadow: true,
})
export class ViewerAnnotationsPinGroup {
  /**
   * The pin to draw for the group
   */
  @Prop({ mutable: true })
  public pin?: Pin;

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

  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  protected render(): JSX.Element {
    if (
      this.viewer?.frame?.scene.camera.projectionViewMatrix == null ||
      this.pin == null
    ) {
      throw new Error('Unable to render pin without projection matrix');
    }

    console.log('got a pin: ', this.pin);

    const projectionViewMatrix =
      this.viewer?.frame?.scene.camera.projectionViewMatrix;
    const pinPoint = this.getFromWorldPosition(
      this.pin.worldPosition,
      projectionViewMatrix,
      this.dimensions
    );

    const screenPosition =
      this.pin.isTextPinEntity() && this.pin.labelOffset != null
        ? translatePointToScreen(this.pin.labelOffset, this.dimensions)
        : undefined;

    return (
      <vertex-viewer-dom-group
        key={`pin-group-${this.pin?.id}`}
        data-testid={`pin-group-${this.pin.id}`}
        position={this.pin.worldPosition}
        class="dom-group"
      >
        <vertex-viewer-dom-element
          key={`drawn-pin-${this.pin.id}`}
          data-testid={`drawn-pin-${this.pin.id}`}
          position={this.pin.worldPosition}
        >
          {this.pin?.isTextPinEntity() && (
            <div class="pin">
              <div
                id="start-anchor"
                class="pin-anchor"
                onPointerDown={(event) => console.log('pointer: ', event)}
              ></div>
            </div>
          )}
          {/* todo add regular pin here */}
        </vertex-viewer-dom-element>

        <vertex-viewer-annotations-pin-label-line
          pin={this.pin}
          viewer={this.viewer}
          pinPoint={pinPoint}
          labelPoint={screenPosition}
        ></vertex-viewer-annotations-pin-label-line>

        <vertex-viewer-annotations-pin-label
          pin={this.pin}
          dimensions={this.dimensions}
          pinModel={this.pinModel}
          viewer={this.viewer}
        ></vertex-viewer-annotations-pin-label>
      </vertex-viewer-dom-group>
    );
  }

  private getFromWorldPosition(
    pt: Vector3.Vector3,
    projectionViewMatrix: Matrix4.Matrix4,
    dimensions: Dimensions.Dimensions
  ): Point.Point | undefined {
    const ndcPt = Vector3.transformMatrix(pt, projectionViewMatrix);
    return Viewport.fromDimensions(dimensions).transformVectorToViewport(ndcPt);
  }
}
