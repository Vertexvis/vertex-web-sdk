import { Component, h, Host, Prop } from '@stencil/core';
import classname from 'classnames';

/**
 * The names of the icons that the `<vertex-viewer-icon>` element can display.
 */
export type ViewerIconName = 'fit-all';

/**
 * The predefined sizes for icons.
 */
export type ViewerIconSize = 'sm' | 'md' | 'lg' | undefined;

@Component({
  tag: 'vertex-viewer-icon',
  styleUrl: 'viewer-icon.css',
  shadow: true,
})
export class ViewerIcon {
  /**
   * The name of the icon to render.
   */
  @Prop()
  public name?: ViewerIconName;

  /**
   * The size of the icon. Can be `'sm' | 'md' | 'lg' | undefined`. Predefined
   * sizes are set to:
   *
   *  * `sm`: 16px
   *  * `md`: 24px
   *  * `lg`: 32px
   *
   * A custom size can be supplied by setting this field to `undefined` and
   * setting `font-size` through CSS. Defaults to `md`.
   */
  @Prop()
  public size?: ViewerIconSize = 'md';

  public render(): h.JSX.IntrinsicElements {
    if (this.name === 'fit-all') {
      return this.renderSvgIcon(
        <path d="M6.15,9.15l-2.5,2.5L2,10v4H6L4.35,12.35l2.5-2.5a.49.49,0,0,0-.7-.7Zm-1.8-5.5L6,2H2V6L3.65,4.35l2.5,2.5a.49.49,0,0,0,.7-.7ZM10,2l1.65,1.65-2.5,2.5a.49.49,0,0,0,.7.7l2.5-2.5L14,6V2ZM9.85,9.15a.49.49,0,0,0-.7.7l2.5,2.5L10,14h4V10l-1.65,1.65Z" />
      );
    } else {
      return <svg />;
    }
  }

  private renderSvgIcon(
    content: h.JSX.IntrinsicElements
  ): h.JSX.IntrinsicElements {
    return (
      <Host
        class={classname({
          'size-sm': this.size === 'sm',
          'size-md': this.size === 'md',
          'size-lg': this.size === 'lg',
        })}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
          {content}
        </svg>
      </Host>
    );
  }
}
