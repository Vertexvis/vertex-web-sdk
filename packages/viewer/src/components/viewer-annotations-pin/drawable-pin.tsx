// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { cssTransformCenterAt } from '../../lib/dom';
import { TextPinEntity } from '../../lib/pins/entities';

export interface DistanceMeasurementRendererProps {
  pin: TextPinEntity;
  selected: boolean;
  onUpdatePin: (pin: TextPinEntity) => void;
  onUpdatePinLabelPosition: (point: Point.Point) => void;
  onSelectPin: (id: string) => void;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
}
export const DrawablePinRenderer: FunctionalComponent<
  DistanceMeasurementRendererProps
> = ({ pin, selected, onUpdatePin, onSelectPin, onUpdatePinLabelPosition }) => {
  const pointerDownAndMove = (): Disposable => {
    console.log('POINTER DOWN');
    const pointerMove = (event: PointerEvent): void => {
      console.log('DRAGGINGL: ', event.clientX, event.clientY);
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
  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        console.log('selecting pin');
        onSelectPin(pin.id);
      }}
      class="pin"
    >
      <div
        id="start-anchor"
        class="pin-anchor"
        onPointerDown={(event) => console.log('pointer: ', event)}
      ></div>
      {pin.labelWorldPosition != null &&
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
              transform: cssTransformCenterAt(pin.labelWorldPosition),
            }}
          />
        ) : (
          <div
            id={`pin-label-${pin.id}`}
            class="distance-label"
            style={{
              transform: cssTransformCenterAt(pin.labelWorldPosition),
            }}
          >
            {pin.labelText || 'Untitled Pin'}
          </div>
        ))}
    </div>
  );
};
