// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { Viewport } from '../..';
import { Pin, TextPinEntity } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';

export interface DistanceMeasurementRendererProps {
  pin: TextPinEntity;
  selected: boolean;
  dimensions: Dimensions.Dimensions;
  projectionViewMatrix: Matrix4.Matrix4;
  viewer?: HTMLVertexViewerElement;
  onUpdatePin: (pin: TextPinEntity) => void;
  // onUpdatePinLabelPosition: (point: Point.Point) => void;
  // onSelectPin: (id: string) => void;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
  pinModel: PinModel;
}
export const DrawablePinRenderer: FunctionalComponent<
  DistanceMeasurementRendererProps
> = ({ pin, dimensions, pinModel, projectionViewMatrix, viewer }) => {
  let pinRef: HTMLVertexViewerAnnotationsPinLabelElement | undefined =
    undefined;
  const screenPosition =
    pin.labelOffset != null
      ? translatePointToScreen(pin.labelOffset, dimensions)
      : undefined;
  const pinPoint = getFromWorldPosition(
    pin.worldPosition,
    projectionViewMatrix,
    dimensions
  );

  return (
    <vertex-viewer-dom-group
      key={`pin-group-${pin.id}`}
      data-testid={`pin-group-${pin.id}`}
    >
      <vertex-viewer-dom-element
        key={`drawn-pin-${pin.id}`}
        data-testid={`drawn-pin-${pin.id}`}
        position={pin.worldPosition}
      >
        <div class="pin">
          <div
            id="start-anchor"
            class="pin-anchor"
            onPointerDown={(event) => console.log('pointer: ', event)}
          ></div>
        </div>
      </vertex-viewer-dom-element>

      <vertex-viewer-annotations-pin-label-line
        pin={pin}
        labelEl={pinRef}
        viewer={viewer}
        pinPoint={pinPoint}
        labelPoint={screenPosition}
      ></vertex-viewer-annotations-pin-label-line>

      <vertex-viewer-annotations-pin-label
        pin={pin}
        dimensions={dimensions}
        pinModel={pinModel}
        viewer={viewer}
        ref={(elm) => {
          console.log('setting element');
          pinRef = elm;
        }}
      ></vertex-viewer-annotations-pin-label>
    </vertex-viewer-dom-group>
  );
};

function getFromWorldPosition(
  pt: Vector3.Vector3,
  projectionViewMatrix: Matrix4.Matrix4,
  dimensions: Dimensions.Dimensions
): Point.Point | undefined {
  const ndcPt = Vector3.transformMatrix(pt, projectionViewMatrix);
  return Viewport.fromDimensions(dimensions).transformVectorToViewport(ndcPt);
}
