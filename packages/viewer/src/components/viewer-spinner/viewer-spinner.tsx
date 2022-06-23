import { Component, h, Prop } from '@stencil/core';
import classNames from 'classnames';

/**
 * The predefined sizes for the spinner.
 */
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | undefined;

@Component({
  tag: 'vertex-viewer-spinner',
  styleUrl: 'viewer-spinner.css',
  shadow: true,
})
export class ViewerSpinner {
  /**
   * The size of the spinner. Can be `'xs' | 'sm' | 'md' | 'lg' | undefined`. Predefined
   * sizes are set to:
   *
   *  * `xm`: 16px
   *  * `sm`: 24px
   *  * `md`: 32px
   *  * `lg`: 64px
   */
  @Prop()
  public size?: SpinnerSize = 'md';

  public render(): h.JSX.IntrinsicElements {
    return (
      <div
        class={classNames('spinner', {
          ['xs']: this.size === 'xs',
          ['sm']: this.size === 'sm',
          ['md']: this.size === 'md',
          ['lg']: this.size === 'lg',
        })}
      >
        <div />
        <div />
        <div />
        <div />
      </div>
    );
  }
}
