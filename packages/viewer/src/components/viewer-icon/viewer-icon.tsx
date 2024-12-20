import { Component, Fragment, h, Host, Prop } from '@stencil/core';
import classname from 'classnames';

/**
 * The names of the icons that the `<vertex-viewer-icon>` element can display.
 */
export type ViewerIconName =
  | 'chevron-down'
  | 'chevron-right'
  | 'close-circle'
  | 'comment-filled'
  | 'comment-show'
  | 'eye-half'
  | 'eye-half-dotted'
  | 'eye-open'
  | 'fit-all'
  | 'locate'
  | 'pin-fill'
  | 'search';

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
    switch (this.name) {
      case 'chevron-down':
        return this.renderSvgIcon(
          <path
            d="M11.88,9.17l-3.5-4a.51.51,0,0,0-.76,0l-3.5,4A.5.5,0,0,0,4.5,10h7a.5.5,0,0,0,.38-.83Z"
            transform="rotate(180 8 8)"
          />
        );
      case 'chevron-right':
        return this.renderSvgIcon(
          <path d="M10.83,7.62l-4-3.5A.5.5,0,0,0,6,4.5v7a.5.5,0,0,0,.83.38l4-3.5a.51.51,0,0,0,0-.76Z" />
        );
      case 'close-circle':
        return this.renderSvgIcon(
          <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zm2.85 9.15a.49.49 0 01-.7.7L8 8.71l-2.15 2.14a.49.49 0 01-.7-.7L7.29 8 5.15 5.85a.49.49 0 01.7-.7L8 7.29l2.15-2.14a.49.49 0 01.7.7L8.71 8z" />
        );
      case 'comment-filled':
        return this.renderSvgIcon(
          <path d="M13.5,2H2.5c-.8,0-1.5.7-1.5,1.5v7c0,.8.7,1.5,1.5,1.5h5.8l2.9,2.9c.1.1.4.2.5.1.2-.1.3-.3.3-.5v-2.5h1.5c.8,0,1.5-.7,1.5-1.5V3.5c0-.8-.7-1.5-1.5-1.5Z" />
        );
      case 'comment-show':
        return this.renderSvgIcon(
          <path d="M11.5,8h-7a.5.5,0,0,0,0,1h7a.5.5,0,0,0,0-1Zm0-3h-7a.5.5,0,0,0,0,1h7a.5.5,0,0,0,0-1Zm2-3H2.5A1.5,1.5,0,0,0,1,3.5v7A1.5,1.5,0,0,0,2.5,12H8.29l2.86,2.85a.47.47,0,0,0,.54.11A.5.5,0,0,0,12,14.5V12h1.5A1.5,1.5,0,0,0,15,10.5v-7A1.5,1.5,0,0,0,13.5,2Zm.5,8.5a.5.5,0,0,1-.5.5h-2a.51.51,0,0,0-.5.5v1.79L8.85,11.15A.47.47,0,0,0,8.5,11h-6a.5.5,0,0,1-.5-.5v-7A.5.5,0,0,1,2.5,3h11a.5.5,0,0,1,.5.5Z" />
        );
      case 'eye-half':
        return this.renderSvgIcon(
          <path d="M13.35 2.65a.48.48 0 00-.7 0l-.78.77a8.71 8.71 0 00-8.52.41A6.57 6.57 0 00.51 7.89v.22a6.58 6.58 0 002.71 4l-.57.58a.49.49 0 00.7.7l10-10a.48.48 0 000-.74zM9.73 5.56a3 3 0 00-4.17 4.17l-1.62 1.62A5.49 5.49 0 011.53 8 5.49 5.49 0 013.9 4.67 7.52 7.52 0 018 3.5a7.67 7.67 0 013.12.67zm3.61-1.2l-.72.72A5.45 5.45 0 0114.47 8a5.49 5.49 0 01-2.37 3.33A7.52 7.52 0 018 12.5a8.15 8.15 0 01-2.41-.38l-.78.78a8.9 8.9 0 003.19.6 8.53 8.53 0 004.65-1.33 6.57 6.57 0 002.84-4.06v-.22a6.56 6.56 0 00-2.15-3.53z" />
        );
      case 'eye-half-dotted':
        return this.renderSvgIcon(
          <Fragment>
            <path d="M4.12 11.46A5.62 5.62 0 011.52 8 5.57 5.57 0 013.9 4.67 7.52 7.52 0 018 3.5a7.7 7.7 0 013.33.75l.74-.74A8.67 8.67 0 008 2.5a8.53 8.53 0 00-4.65 1.33A6.57 6.57 0 00.51 7.89v.22a6.54 6.54 0 002.88 4.08z" />
            <path d="M8 5a3 3 0 00-3 3 3 3 0 00.69 1.89l4.2-4.2A3 3 0 008 5zM5.88 5.88zM9.2 12.41a.51.51 0 00-.42.57.5.5 0 00.56.42.5.5 0 00.43-.57.51.51 0 00-.57-.42zM6.77 12.41a.5.5 0 00-.57.42.49.49 0 00.41.57.5.5 0 10.15-1zM14.48 5.61a.5.5 0 00-.7-.12.49.49 0 00-.12.69.5.5 0 00.82-.57zM11.5 11.68a.5.5 0 00-.22.67.51.51 0 00.68.22.5.5 0 00-.46-.89zM15.07 7.77a.52.52 0 00-.62.35.51.51 0 00.35.62.5.5 0 00.61-.35.52.52 0 00-.34-.62zM13.36 10.21a.5.5 0 10.76.64.49.49 0 00-.06-.7.51.51 0 00-.7.06z" />
          </Fragment>
        );
      case 'eye-open':
        return this.renderSvgIcon(
          <path d="M8 5a3 3 0 103 3 3 3 0 00-3-3zm4.65-1.17A8.53 8.53 0 008 2.5a8.53 8.53 0 00-4.65 1.33A6.57 6.57 0 00.51 7.89v.22a6.57 6.57 0 002.84 4.06A8.53 8.53 0 008 13.5a8.53 8.53 0 004.65-1.33 6.57 6.57 0 002.84-4.06v-.22a6.57 6.57 0 00-2.84-4.06zm-.55 7.5A7.52 7.52 0 018 12.5a7.52 7.52 0 01-4.1-1.17A5.49 5.49 0 011.53 8 5.49 5.49 0 013.9 4.67 7.52 7.52 0 018 3.5a7.52 7.52 0 014.1 1.17A5.49 5.49 0 0114.47 8a5.49 5.49 0 01-2.37 3.33z" />
        );
      case 'fit-all':
        return this.renderSvgIcon(
          <path d="M6.15,9.15l-2.5,2.5L2,10v4H6L4.35,12.35l2.5-2.5a.49.49,0,0,0-.7-.7Zm-1.8-5.5L6,2H2V6L3.65,4.35l2.5,2.5a.49.49,0,0,0,.7-.7ZM10,2l1.65,1.65-2.5,2.5a.49.49,0,0,0,.7.7l2.5-2.5L14,6V2ZM9.85,9.15a.49.49,0,0,0-.7.7l2.5,2.5L10,14h4V10l-1.65,1.65Z" />
        );
      case 'pin-fill':
        return this.renderSvgIcon(
          <path d="M8,.55A5.9,5.9,0,0,0,2.1,6.44a9.14,9.14,0,0,0,2.66,6.24,11.44,11.44,0,0,0,1.93,1.65,7.43,7.43,0,0,0,.73.44l.28.12a.78.78,0,0,0,.6,0,6.65,6.65,0,0,0,1.34-.79,11.79,11.79,0,0,0,2.76-2.88,8.59,8.59,0,0,0,1.5-4.78A5.9,5.9,0,0,0,8,.55ZM8,8.44a2,2,0,1,1,2-2A2,2,0,0,1,8,8.44Z" />
        );
      case 'search':
        return this.renderSvgIcon(
          <path d="M14.85 14.15l-4-4a.37.37 0 00-.2-.12 5.45 5.45 0 10-.62.62.37.37 0 00.12.2l4 4a.49.49 0 00.7-.7zM9.71 9.71a4.51 4.51 0 01-6.42 0 4.51 4.51 0 010-6.42 4.51 4.51 0 016.42 0 4.51 4.51 0 010 6.42z" />
        );
      case 'locate':
        return this.renderSvgIcon(
          <path d="M8,2a6,6,0,0,1,6,6,6,6,0,0,1,-6,6,6,6,0,0,1,-6,-6,6,6,0,0,1,6,-6ZM8,13a5,5,0,0,0,5,-5,5,5,0,0,0,-5,-5,5,5,0,0,0,-5,5,5,5,0,0,0,5,5ZM8,5a3,3,0,0,1,3,3,3,3,0,0,1,-3,3,3,3,0,0,1,-3,-3,3,3,0,0,1,3,-3ZM7.5,2v-1.5a.3,.3,0,0,1,1,0v1.5ZM7.5,14v1.5a.3,.3,0,0,0,1,0v-1.5ZM14,7.5h1.5a.3,.3,0,0,1,0,1h-1.5ZM2,7.5h-1.5a.3,.3,0,0,0,0,1h1.5ZM8,16v-5ZM16,8h-5ZM0,8h4Z" />
        );
      default:
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
