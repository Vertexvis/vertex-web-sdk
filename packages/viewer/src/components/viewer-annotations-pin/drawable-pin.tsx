// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Dimensions, Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { TextPinEntity } from '../../lib/pins/entities';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';

export interface DistanceMeasurementRendererProps {
  pin: TextPinEntity;
  selected: boolean;
  dimensions?: Dimensions.Dimensions;
  onUpdatePin: (pin: TextPinEntity) => void;
  onUpdatePinLabelPosition: (point: Point.Point) => void;
  onSelectPin: (id: string) => void;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
}
export const DrawablePinRenderer: FunctionalComponent<
  DistanceMeasurementRendererProps
> = ({
  pin,
  dimensions,
  selected,
  onUpdatePin,
  onSelectPin,
  onUpdatePinLabelPosition,
}) => {
  const pointerDownAndMove = (): Disposable => {
    const pointerMove = (event: PointerEvent): void => {
      onUpdatePinLabelPosition({
        x: event.clientX,
        y: event.clientY,
      });
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
    pin.labelOffset != null && dimensions != null
      ? translatePointToScreen(pin.labelOffset, dimensions)
      : undefined;

  console.log('screenPosition: ', screenPosition);
  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelectPin(pin.id);
      }}
      class="pin"
    >
      <div
        id="start-anchor"
        class="pin-anchor"
        onPointerDown={(event) => console.log('pointer: ', event)}
      ></div>
      {/* {screenPosition != null &&
        (selected ? (
          <input
            id={`pin-label-${pin.id}`}
            class="distance-label"
            type="text"
            autofocus={selected}
            placeholder="Untitled Pin"
            onPointerDown={pointerDownAndMove}
            value={pin.labelText}
            onInput={(event) => {
              onUpdatePin({
                ...pin,
                labelText: (event.target as HTMLInputElement).value,
              });
            }}
            style={{
              top: `${screenPosition.y.toString()}px`,
              left: `${screenPosition.x.toString()}px`,
            }}
          />
        ) : (
          <div
            id={`pin-label-${pin.id}`}
            class="distance-label"
            style={{
              position: 'absolute',
              top: screenPosition.y.toString(),
              left: screenPosition.x.toString(),
              // transform: `translate(-50%, -50%) translate(${pin.labelOffset.x}px, ${pin.labelOffset.y}px)`,
            }}
          >
            {pin.labelText || 'Untitled Pin'}
          </div>
        ))} */}
    </div>
  );
};
