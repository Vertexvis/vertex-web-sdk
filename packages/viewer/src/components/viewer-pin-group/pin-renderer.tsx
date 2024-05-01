// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';
import classNames from 'classnames';

import { getPinColors, isIconPin, isTextPin, Pin } from '../../lib/pins/model';

interface PinRendererProps {
  pin?: Pin;
  selected: boolean;
  occluded: boolean;
}

export const PinRenderer: FunctionalComponent<PinRendererProps> = ({
  pin,
  selected,
  occluded,
}) => {
  const { primaryColor } = getPinColors(pin);

  return (
    <Fragment>
      {isTextPin(pin) && (
        <div
          id="pin-anchor"
          class={classNames('pin-anchor', {
            selected: selected,
            occluded: occluded,
          })}
          style={{
            background: primaryColor,
          }}
        ></div>
      )}

      {isIconPin(pin) && (
        <vertex-viewer-icon
          name="pin-fill"
          size="lg"
          class={classNames('pin', {
            'pin-selected': selected,
            'pin-occluded': occluded,
          })}
          style={{
            color: primaryColor,
          }}
        />
      )}
    </Fragment>
  );
};
