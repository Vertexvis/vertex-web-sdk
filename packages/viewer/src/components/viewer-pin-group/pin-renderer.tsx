// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';
import classNames from 'classnames';

import { isDefaultPin, isTextPin, Pin } from '../../lib/pins/model';

interface PinRendererProps {
  pin?: Pin;
  selected: boolean;
}

export const PinRenderer: FunctionalComponent<PinRendererProps> = ({
  pin,
  selected,
}) => {
  return (
    <Fragment>
      {isTextPin(pin) && (
        <div
          id="pin-anchor"
          class={classNames('pin-anchor', { selected: selected })}
        ></div>
      )}

      {isDefaultPin(pin) && (
        <vertex-viewer-icon
          name="pin-fill"
          size="lg"
          class={classNames('pin', { 'pin-selected': selected })}
        />
      )}
    </Fragment>
  );
};
