import { Component, Host, h, Prop, Element, Watch } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-layer',
  styleUrl: 'viewer-layer.css',
  shadow: true,
})
export class ViewerLayer {
  /**
   * Indicates if the layer should stretch to fill the size of its container's
   * nearest positioned parent.
   */
  @Prop({ reflect: true }) public stretchOff = false;

  /**
   * Prevents the viewer from receiving events that would trigger camera
   * interactions.
   */
  @Prop({ reflect: true }) public viewerInteractionsOff = false;

  @Element() private hostEl!: HTMLElement;

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.updateInteractionEvents();
  }

  @Watch('viewerInteractionsOff')
  protected handleViewerInteractionsOffChanged(): void {
    this.updateInteractionEvents();
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

  private updateInteractionEvents(): void {
    const stopEventPropagation = (event: Event): void => {
      event.stopPropagation();
    };

    disabledInteractionEvents.forEach((event) => {
      this.hostEl.removeEventListener(event, stopEventPropagation);

      if (this.viewerInteractionsOff) {
        this.hostEl.addEventListener(event, stopEventPropagation);
      }
    });
  }
}

const disabledInteractionEvents: (keyof GlobalEventHandlersEventMap)[] = [
  'mousedown',
  'pointerdown',
  'keydown',
];
