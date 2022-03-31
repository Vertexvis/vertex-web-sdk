import {
  Component,
  Element,
  Event,
  EventEmitter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dimensions, Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { PinController } from '../../lib/pins/controller';
import { isTextPin, TextPin } from '../../lib/pins/entities';
import { PinModel } from '../../lib/pins/model';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';

@Component({
  tag: 'vertex-viewer-pin-label',
  styleUrl: 'vertex-pin-label.css',
  shadow: false,
})
export class VertexPinLabel {
  /**
   * The pin to draw for the group
   */
  @Prop({ mutable: true })
  public pin?: TextPin;

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
   * The current text value of the component. Value is updated on user
   * interaction.
   */
  @Prop({ mutable: true })
  public value = '';

  /**
   * The model that contains the entities and outcomes from performing pin operations
   */
  @Prop()
  public pinModel: PinModel = new PinModel();

  /**
   * @internal
   */
  @Event({ bubbles: true })
  public labelChanged!: EventEmitter<void>;

  /**
   * The model that contains the entities and outcomes from performing pin operations
   */
  @Prop()
  public pinController?: PinController;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private focused = false;

  private inputEl?: HTMLInputElement;

  /**
   * Gives focus to the the component's internal text input.
   */
  @Method()
  public async setFocus(): Promise<void> {
    // HTMLInputElement.focus() doesn't exist in tests.
    if (typeof this.inputEl?.focus === 'function') {
      this.inputEl?.focus();
    }
  }

  @Watch('focused')
  protected watchFocusChange(): void {
    this.labelChanged.emit();
  }

  protected componentDidLoad(): void {
    const resize = new ResizeObserver(() => {
      this.labelChanged.emit();
    });

    if (this.hostEl != null) {
      resize.observe(this.hostEl);
    }
  }

  protected componentDidRender(): void {
    if (this.focused && this.inputEl != null) {
      this.inputEl.focus();
    }
  }

  protected render(): JSX.Element {
    if (this.pin == null) {
      throw new Error('Unable to render pin');
    }

    const onUpdatePin = (updatedPin: TextPin): void => {
      this.pinModel.setEntity(updatedPin);
    };
    const pointerDownAndMove = (pointerDown: PointerEvent): Disposable => {
      this.pinModel.setSelectedPin(this.pin?.id);

      const pointerMove = (event: PointerEvent): void => {
        const myUpdatedPin: TextPin | undefined = isTextPin(this.pin)
          ? new TextPin(this.pin.id, this.pin.worldPosition, this.pin.point, {
              labelPoint: translatePointToRelative(
                {
                  x: event.clientX,
                  y: event.clientY,
                },
                this.dimensions
              ),
              labelText: this.pin.attributes.labelText,
            })
          : undefined;

        if (myUpdatedPin) {
          onUpdatePin(myUpdatedPin);
        }
      };

      const dispose = (): void => {
        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);
      };

      const pointerUp = (pointerUp: PointerEvent): void => {
        if (
          Point.distance(
            pointerDown,
            Point.create(pointerUp.clientX, pointerUp.clientY)
          ) <= 2
        ) {
          this.focused = true;
        }
        dispose();
      };

      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);

      return {
        dispose,
      };
    };

    const screenPosition =
      isTextPin(this.pin) && this.pin.attributes.labelPoint != null
        ? translatePointToScreen(
            this.pin.attributes.labelPoint,
            this.dimensions
          )
        : undefined;

    return (
      <Host>
        {this.focused ? (
          <input
            id={`pin-label-${this.pin.id}`}
            type="text"
            class={classNames('pin-label')}
            ref={(ref) => (this.inputEl = ref)}
            value={this.value}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                this.submit();
              }
            }}
            onInput={this.handleTextInput}
            onFocus={this.handleTextFocus}
            autofocus={true}
            autoFocus={true}
            onBlur={this.handleTextBlur}
            style={{
              top: `${screenPosition?.y.toString() || 0}px`,
              left: `${screenPosition?.x.toString() || 0}px`,
            }}
          />
        ) : (
          <div
            id={`pin-label-${this.pin.id}`}
            class={classNames('pin-label')}
            style={{
              top: `${screenPosition?.y.toString() || 0}px`,
              left: `${screenPosition?.x.toString() || 0}px`,
            }}
            onPointerDown={pointerDownAndMove}
          >
            {this.pin.attributes.labelText}
          </div>
        )}
      </Host>
    );
  }

  private handleTextFocus = (): void => {
    this.focused = true;
  };

  private handleTextBlur = (): void => {
    this.submit();
  };

  private submit(): void {
    this.focused = false;
    if (this.pin != null) {
      this.pinModel.setEntity({
        ...this.pin,
        attributes: {
          labelPoint: this.pin.attributes.labelPoint,
          labelText: this.value,
        },
      });
    }
  }

  private handleTextInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
  };
}
