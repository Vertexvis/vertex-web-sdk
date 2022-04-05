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
import { Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { getMouseClientPosition } from '../../lib/dom';
import { PinController } from '../../lib/pins/controller';
import { isTextPin, PinModel, TextPin } from '../../lib/pins/model';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';

@Component({
  tag: 'vertex-viewer-pin-label',
  styleUrl: 'viewer-pin-label.css',
  shadow: false,
})
export class VertexPinLabel {
  /**
   * The pin to draw for the group
   */
  @Prop()
  public pin?: TextPin;

  /**
   * The dimensions of the canvas for the pins
   */
  @Prop()
  public elementBounds?: DOMRect;

  /**
   * The current text value of the component. Value is updated on user
   * interaction.
   */
  @Prop({ mutable: true })
  public value: string;

  /**
   * The controller that drives behavior for pin operations
   */
  @Prop()
  public pinController?: PinController;

  /**
   * @internal
   */
  @Event({ bubbles: true })
  public labelChanged!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private focused = false;

  @State()
  private computedScreenPosition?: Point.Point;

  private inputEl?: HTMLInputElement;

  private resizeObserver?: ResizeObserver;

  public constructor() {
    if (this.pin?.label.text != null) {
      this.value = this.pin.label.text;
    } else {
      this.value = '';
    }
  }

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

  @Watch('pin')
  protected watchPinChange(): void {
    this.computeScreenPosition();
  }

  @Watch('elementBounds')
  protected watchElementBoundsChange(): void {
    this.computeScreenPosition();
  }

  protected componentDidLoad(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.labelChanged.emit();
    });

    if (this.hostEl != null) {
      this.resizeObserver.observe(this.hostEl);
    }

    if (this.pinController == null) {
      this.pinController = new PinController(new PinModel());
    }
  }

  protected disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
  }

  protected componentDidRender(): void {
    if (this.focused && this.inputEl != null) {
      this.setFocus();
    }
  }

  protected render(): JSX.Element {
    const screenPosition =
      this.computedScreenPosition || this.computeScreenPosition();
    return (
      <Host>
        {this.focused ? (
          <input
            id={`pin-label-${this.pin?.id}`}
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
            onBlur={this.handleTextBlur}
            style={{
              top: `${screenPosition?.y.toString() || 0}px`,
              left: `${screenPosition?.x.toString() || 0}px`,
            }}
          />
        ) : (
          <div
            id={`pin-label-${this.pin?.id}`}
            class={classNames('pin-label')}
            style={{
              top: `${screenPosition?.y.toString() || 0}px`,
              left: `${screenPosition?.x.toString() || 0}px`,
            }}
            onPointerDown={(e) => this.pointerDownAndMove(e)}
          >
            {this.pin?.label.text}
          </div>
        )}
      </Host>
    );
  }

  private computeScreenPosition(): Point.Point | undefined {
    this.computedScreenPosition =
      isTextPin(this.pin) &&
      this.elementBounds != null &&
      this.pin.label.point != null
        ? translatePointToScreen(this.pin.label.point, this.elementBounds)
        : undefined;
    return this.computedScreenPosition;
  }

  private pointerDownAndMove(pointerDown: PointerEvent): Disposable {
    this.pinController?.setSelectedPinId(this.pin?.id);

    const pointerMove = (event: PointerEvent): void => {
      if (this.elementBounds != null) {
        const point = getMouseClientPosition(event, this.elementBounds);
        const myUpdatedPin =
          this.pin != null
            ? {
                id: this.pin.id,
                worldPosition: this.pin.worldPosition,
                label: {
                  point: translatePointToRelative(point, this.elementBounds),
                  text: this.pin.label.text,
                },
              }
            : undefined;

        if (myUpdatedPin) {
          this.pinController?.setPin(myUpdatedPin);
        }
      }
    };

    const dispose = (): void => {
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
    };

    const pointerUp = (pointerUp: PointerEvent): void => {
      const distnaceBetweenStartAndEndPoint = Point.distance(
        Point.create(pointerDown.clientX, pointerUp.clientY),
        Point.create(pointerUp.clientX, pointerUp.clientY)
      );

      if (distnaceBetweenStartAndEndPoint <= 2) {
        this.focused = true;
      }
      dispose();
    };

    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);

    return {
      dispose,
    };
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
      this.pinController?.setPin({
        ...this.pin,
        label: {
          point: this.pin.label.point,
          text: this.value,
        },
      });
    }
  }

  private handleTextInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
  };
}
