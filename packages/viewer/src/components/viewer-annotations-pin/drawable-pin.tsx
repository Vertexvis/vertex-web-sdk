// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';

import { cssTransformCenterAt } from '../../lib/dom';
import { TextPinEntity } from '../../lib/pins/entities';

export interface DistanceMeasurementRendererProps {
  pin: TextPinEntity;
  selected: boolean;
  onUpdatePin: (pin: TextPinEntity) => void;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
}
export const DrawablePinRenderer: FunctionalComponent<
  DistanceMeasurementRendererProps
> = ({ pin, selected, onUpdatePin }) => {
  return (
    <div class="pin">
      <div
        id="start-anchor"
        class="pin-anchor"
        // style={{ transform: cssTrsansformCenterAt(m.point) }}
        onPointerDown={(event) => console.log('pointer: ', event)}
      ></div>
      {pin.labelWorldPosition != null &&
        (selected ? (
          <input
            id={`pin-label-${pin.id}`}
            class="distance-label"
            type="text"
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
            {pin.labelText}
          </div>
        ))}
    </div>
  );
};
