// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import classNames from 'classnames';

interface Props {
  side: string;
  disabled: boolean;
  onMouseDown: (event: MouseEvent) => void;
}

export const ViewerViewCubeSide: FunctionalComponent<Props> = (
  { side, disabled, onMouseDown },
  children
) => {
  return (
    <div
      id={side}
      class={classNames(`cube-side cube-face cube-face-${side}`, { disabled })}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
};
