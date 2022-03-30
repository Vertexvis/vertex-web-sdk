import {
  Component,
  Element,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Prop,
} from '@stencil/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dimensions } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { isTextPinEntity, Pin, TextPinEntity } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';

@Component({
  tag: 'vertex-viewer-annotations-pin-label',
  styleUrl: 'vertex-annotations-pin-label.css',
  shadow: true,
})
export class VertexAnnotationsPinLabel {
  /**
   * The pin to draw for the group
   */
  @Prop({ mutable: true })
  public pin?: Pin;

  /**
   * The dimensions of the canvas for the pins
   */
  @Prop({ mutable: true })
  public dimensions: Dimensions.Dimensions = { height: 0, width: 0 };

  /**
   * The dimensions of the the pin label
   */
  @Prop({ mutable: true })
  public pinLabelDimensions: Dimensions.Dimensions = { height: 0, width: 0 };

  /**
   * The model that contains the entities and outcomes from performing pin annotations
   */
  @Prop()
  public pinModel: PinModel = new PinModel();

  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Element()
  private hostEl!: HTMLElement;

  protected componentDidLoad(): void {
    const resize = new ResizeObserver(() => this.computeLabelDimensions());

    const pinLabel = this.hostEl.shadowRoot?.getElementById(
      `pin-label-${this.pin?.id}`
    );

    if (pinLabel != null) {
      resize.observe(pinLabel);
    }

    this.computeLabelDimensions();
  }

  protected render(): JSX.Element {
    if (this.pin == null) {
      throw new Error('Unable to render pin');
    }

    const onUpdatePin = (updatedPin: TextPinEntity): void => {
      this.pinModel.setEntity(updatedPin);
    };
    const pointerDownAndMove = (): Disposable => {
      const pointerMove = (event: PointerEvent): void => {
        const myUpdatedPin: TextPinEntity | undefined = isTextPinEntity(
          this.pin
        )
          ? new TextPinEntity(
              this.pin.id,
              this.pin.worldPosition,
              this.pin.point,
              translatePointToRelative(
                {
                  x: event.clientX,
                  y: event.clientY,
                },
                this.dimensions
              ),
              this.pin.labelText
            )
          : undefined;

        if (myUpdatedPin) {
          onUpdatePin(myUpdatedPin);
        }
      };

      const dispose = (): void => {
        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);
      };

      const pointerUp = (): void => dispose();

      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);

      return {
        dispose,
      };
    };

    const screenPosition =
      isTextPinEntity(this.pin) && this.pin.labelOffset != null
        ? translatePointToScreen(this.pin.labelOffset, this.dimensions)
        : undefined;

    return (
      <Host>
        <div
          id={`pin-label-${this.pin.id}`}
          class="pin-label"
          onPointerDown={pointerDownAndMove}
          style={{
            top: `${screenPosition?.y.toString() || 0}px`,
            left: `${screenPosition?.x.toString() || 0}px`,
          }}
        >
          Untitled Pin
        </div>
      </Host>
    );
  }

  private computeLabelDimensions(): void {
    const pinLabel = this.hostEl.shadowRoot?.getElementById(
      `pin-label-${this.pin?.id}`
    );

    if (pinLabel) {
      this.pinLabelDimensions = {
        height: pinLabel.offsetHeight,
        width: pinLabel.offsetWidth,
      };
    }
  }
}
