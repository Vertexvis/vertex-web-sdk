import { Component, h, Host, Prop } from '@stencil/core';
import classname from 'classnames';

/**
 * The names of the icons that the `<vertex-viewer-icon>` element can display.
 */
export type ViewerIconName =
  | 'fit-all'
  | 'visible'
  | 'hidden'
  | 'chevron-right'
  | 'chevron-down'
  | 'search'
  | 'close-circle';

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
    } else if (this.name === 'visible') {
      return this.renderSvgIcon(
        <path d="M8 5a3 3 0 103 3 3 3 0 00-3-3zm4.65-1.17A8.53 8.53 0 008 2.5a8.53 8.53 0 00-4.65 1.33A6.57 6.57 0 00.51 7.89v.22a6.57 6.57 0 002.84 4.06A8.53 8.53 0 008 13.5a8.53 8.53 0 004.65-1.33 6.57 6.57 0 002.84-4.06v-.22a6.57 6.57 0 00-2.84-4.06zm-.55 7.5A7.52 7.52 0 018 12.5a7.52 7.52 0 01-4.1-1.17A5.49 5.49 0 011.53 8 5.49 5.49 0 013.9 4.67 7.52 7.52 0 018 3.5a7.52 7.52 0 014.1 1.17A5.49 5.49 0 0114.47 8a5.49 5.49 0 01-2.37 3.33z" />
      );
    } else if (this.name === 'hidden') {
      return this.renderSvgIcon(
        <path d="M13.35 2.65a.48.48 0 00-.7 0l-.78.77a8.71 8.71 0 00-8.52.41A6.57 6.57 0 00.51 7.89v.22a6.58 6.58 0 002.71 4l-.57.58a.49.49 0 00.7.7l10-10a.48.48 0 000-.74zM9.73 5.56a3 3 0 00-4.17 4.17l-1.62 1.62A5.49 5.49 0 011.53 8 5.49 5.49 0 013.9 4.67 7.52 7.52 0 018 3.5a7.67 7.67 0 013.12.67zm3.61-1.2l-.72.72A5.45 5.45 0 0114.47 8a5.49 5.49 0 01-2.37 3.33A7.52 7.52 0 018 12.5a8.15 8.15 0 01-2.41-.38l-.78.78a8.9 8.9 0 003.19.6 8.53 8.53 0 004.65-1.33 6.57 6.57 0 002.84-4.06v-.22a6.56 6.56 0 00-2.15-3.53z" />
      );
    } else if (this.name === 'chevron-right') {
      return this.renderSvgIcon(
        <path d="M10.83,7.62l-4-3.5A.5.5,0,0,0,6,4.5v7a.5.5,0,0,0,.83.38l4-3.5a.51.51,0,0,0,0-.76Z" />
      );
    } else if (this.name === 'chevron-down') {
      return this.renderSvgIcon(
        <path
          d="M11.88,9.17l-3.5-4a.51.51,0,0,0-.76,0l-3.5,4A.5.5,0,0,0,4.5,10h7a.5.5,0,0,0,.38-.83Z"
          transform="rotate(180 8 8)"
        />
      );
    } else if (this.name === 'search') {
      return this.renderSvgIcon(
        <path d="M14.85 14.15l-4-4a.37.37 0 00-.2-.12 5.45 5.45 0 10-.62.62.37.37 0 00.12.2l4 4a.49.49 0 00.7-.7zM9.71 9.71a4.51 4.51 0 01-6.42 0 4.51 4.51 0 010-6.42 4.51 4.51 0 016.42 0 4.51 4.51 0 010 6.42z" />
      );
    } else if (this.name === 'close-circle') {
      return this.renderSvgIcon(
        <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zm2.85 9.15a.49.49 0 01-.7.7L8 8.71l-2.15 2.14a.49.49 0 01-.7-.7L7.29 8 5.15 5.85a.49.49 0 01.7-.7L8 7.29l2.15-2.14a.49.49 0 01.7.7L8.71 8z" />
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
