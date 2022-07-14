// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';
import classNames from 'classnames';

import { getPinColors, isIconPin, isTextPin, Pin } from '../../lib/pins/model';

interface PinRendererProps {
  pin?: Pin;
  selected: boolean;
}

export const PinRenderer: FunctionalComponent<PinRendererProps> = ({
  pin,
  selected,
}) => {
  const { primaryColor } = getPinColors(pin);

  console.log('primaryColor: ', primaryColor);

  return (
    <Fragment>
      {isTextPin(pin) && (
        <div
          id="pin-anchor"
          class={classNames('pin-anchor', { selected: selected })}
          style={{
            background: primaryColor,
          }}
        ></div>
      )}

      {isIconPin(pin) && (
        <vertex-viewer-icon
          name="pin-fill"
          size="lg"
          class={classNames('pin', { 'pin-selected': selected })}
          style={{
            color: 'red',
          }}
        />
      )}
    </Fragment>
  );
};
