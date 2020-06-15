import { h, Component } from '@stencil/core';

@Component({
  tag: 'viewer-toolbar-divider',
  styleUrl: 'viewer-toolbar-divider.css',
})
export class Divider {
  public render(): h.JSX.IntrinsicElements {
    return <div />;
  }
}
