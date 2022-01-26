// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import classNames from 'classnames';
import { paramCase } from 'param-case';

interface MeasurementDetailsEntryProps {
  label: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MeasurementDetailsEntry: FunctionalComponent<
  MeasurementDetailsEntryProps
> = ({ label, ...props }, children) => {
  return (
    <div {...props} class="measurement-details-entry">
      <div
        class={classNames('measurement-details-entry-label', paramCase(label))}
      >
        {label}:
      </div>
      {children}
    </div>
  );
};
