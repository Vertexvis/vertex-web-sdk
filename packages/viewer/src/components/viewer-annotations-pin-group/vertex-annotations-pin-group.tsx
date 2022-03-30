import {
  Component,
  Element,
  Fragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { Viewport } from '../..';
import { Pin, TextPinEntity } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';

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

    const onUpdatePin = (updatedPin: TextPinEntity): void => {
      this.pinModel.setEntity(updatedPin);
    };

    const projectionViewMatrix =
      this.viewer?.frame?.scene.camera.projectionViewMatrix;
    const pinPoint = this.getFromWorldPosition(
      this.pin.worldPosition,
      projectionViewMatrix,
      this.dimensions
    );

    const pointerDownAndMove = (): Disposable => {
      const pointerMove = (event: PointerEvent): void => {
        const myUpdatedPin: TextPinEntity | undefined =
          this.pin?.isTextPinEntity()
            ? new TextPinEntity(
                this.pin.id,
                this.pin.worldPosition,
                this.pin.point,
                translatePointToRelative(
                  {
                    x: event.clientX,
                    y: event.clientY,
                  },
                  this.dimensions
                ),
                this.pin.labelText
              )
            : undefined;

        if (myUpdatedPin) {
          onUpdatePin(myUpdatedPin);
        }
      };

      const dispose = (): void => {
        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);
      };

      const pointerUp = (): void => dispose();

      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);

      return {
        dispose,
      };
    };

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
          <div class="pin">
            <div
              id="start-anchor"
              class="pin-anchor"
              onPointerDown={(event) => console.log('pointer: ', event)}
            ></div>
            {/* todo add a slot here to replace this. */}
          </div>
        </vertex-viewer-dom-element>

        {screenPosition != null && pinPoint != null && (
          <svg class="svg">
            <g>
              <line
                id="arrow-line"
                class="line"
                x1={screenPosition.x}
                y1={screenPosition.y}
                x2={pinPoint.x}
                y2={pinPoint.y}
                style={{
                  stroke: `rgb(255,0,0)`,
                  'stroke-width': '2',
                }}
              />
            </g>
          </svg>
        )}
        {screenPosition != null && (
          <div
            id={`pin-label-${this.pin.id}`}
            class="distance-label"
            onPointerDown={pointerDownAndMove}
            style={{
              top: `${screenPosition?.y.toString() || 0}px`,
              left: `${screenPosition?.x.toString() || 0}px`,
            }}
          >
            Untitled Pin
          </div>
        )}
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

// export interface DistanceMeasurementRendererProps {
//   pin: TextPinEntity;
//   selected: boolean;
//   dimensions: Dimensions.Dimensions;
//   projectionViewMatrix: Matrix4.Matrix4;
//   onUpdatePin: (pin: TextPinEntity) => void;
//   // onUpdatePinLabelPosition: (point: Point.Point) => void;
//   // onSelectPin: (id: string) => void;
//   onStartAnchorPointerDown?: (event: PointerEvent) => void;
//   onEndAnchorPointerDown?: (event: PointerEvent) => void;
// }
// export const DrawablePinRenderer: FunctionalComponent<
//   DistanceMeasurementRendererProps
// > = ({
//   pin,
//   dimensions,
//   selected,
//   projectionViewMatrix,
//   onUpdatePin,
//   // onSelectPin,
//   // onUpdatePinLabelPosition,
// }) => {
// const pointerDownAndMove = (): Disposable => {
//   const pointerMove = (event: PointerEvent): void => {
//     onUpdatePin({
//       ...pin,
//       labelOffset: translatePointToRelative(
//         {
//           x: event.clientX,
//           y: event.clientY,
//         },
//         dimensions
//       ),
//     });
//   };

//     const dispose = (): void => {
//       window.removeEventListener('pointermove', pointerMove);
//       window.removeEventListener('pointerup', pointerUp);
//     };

//     const pointerUp = (): void => dispose();

//     window.addEventListener('pointermove', pointerMove);
//     window.addEventListener('pointerup', pointerUp);

//     return {
//       dispose,
//     };
//   };
//   const screenPosition =
//     pin.labelOffset != null
//       ? translatePointToScreen(pin.labelOffset, dimensions)
//       : undefined;
//   console.log('screenPosistion: ', screenPosition);
//   const pinPoint = getFromWorldPosition(
//     pin.worldPosition,
//     projectionViewMatrix,
//     dimensions
//   );

//   console.log('pinPoint: ', pinPoint);
// return (
//   <vertex-viewer-dom-group
//     key={`pin-group-${pin.id}`}
//     data-testid={`pin-group-${pin.id}`}
//   >
//     <vertex-viewer-dom-element
//       key={`drawn-pin-${pin.id}`}
//       data-testid={`drawn-pin-${pin.id}`}
//       position={pin.worldPosition}
//     >
//       <div class="pin">
//         <div
//           id="start-anchor"
//           class="pin-anchor"
//           onPointerDown={(event) => console.log('pointer: ', event)}
//         ></div>
//       </div>
//     </vertex-viewer-dom-element>

//     {screenPosition != null && pinPoint != null && (
//       <svg class="svg">
//         <g>
//           <line
//             id="arrow-line"
//             class="line"
//             x1={screenPosition.x}
//             y1={screenPosition.y}
//             x2={pinPoint.x}
//             y2={pinPoint.y}
//             style={{
//               stroke: `rgb(255,0,0)`,
//               'stroke-width': '2',
//             }}
//           />
//         </g>
//       </svg>
//     )}
//     {screenPosition != null && (
//       <div
//         id={`pin-label-${pin.id}`}
//         class="distance-label"
//         onPointerDown={pointerDownAndMove}
//         style={{
//           top: `${screenPosition?.y.toString() || 0}px`,
//           left: `${screenPosition?.x.toString() || 0}px`,
//         }}
//       >
//         Untitled Pin
//       </div>
//     )}
//   </vertex-viewer-dom-group>
// );
// };

// function getFromWorldPosition(
//   pt: Vector3.Vector3,
//   projectionViewMatrix: Matrix4.Matrix4,
//   dimensions: Dimensions.Dimensions
// ): Point.Point | undefined {
//   const ndcPt = Vector3.transformMatrix(pt, projectionViewMatrix);
//   return Viewport.fromDimensions(dimensions).transformVectorToViewport(ndcPt);
// }
