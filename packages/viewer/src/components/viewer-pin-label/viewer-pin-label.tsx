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
import classNames from 'classnames';

import { getMouseClientPosition } from '../../lib/dom';
import { PinController } from '../../lib/pins/controller';
import { isTextPin, PinModel, TextPin } from '../../lib/pins/model';
import { readDOM } from '../../lib/stencil';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';
import { getComputedStyle } from './utils';

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

  /**
   * Emitted whenever the label is focused, with the ID of the
   * associated pin (or undefined if no pin is provided).
   */
  @Event({ bubbles: true })
  public labelFocused!: EventEmitter<string | undefined>;

  /**
   * Emitted whenever the label is blurred, with the ID of the
   * associated pin (or undefined if no pin is provided).
   */
  @Event({ bubbles: true })
  public labelBlurred!: EventEmitter<string | undefined>;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private focused = false;

  @State()
  private computedScreenPosition?: Point.Point;

  @State()
  private textareaRows = 1;

  @State()
  private contentElBounds?: DOMRect;

  private relativePointerDownPosition?: Point.Point;
  private pinPointerDownPosition?: Point.Point;

  private inputEl?: HTMLTextAreaElement;
  private contentEl?: HTMLDivElement;

  private resizeObserver?: ResizeObserver;
  private contentResizeObserver?: ResizeObserver;

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

  protected componentWillLoad(): void {
    this.computeScreenPosition();
  }

  protected componentDidLoad(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.labelChanged.emit();
    });

    this.contentResizeObserver = new ResizeObserver(this.computeContentSize);

    if (this.hostEl != null) {
      this.resizeObserver.observe(this.hostEl);
    }

    if (this.contentEl != null) {
      this.contentResizeObserver.observe(this.contentEl);
    }

    if (this.pinController == null) {
      this.pinController = new PinController(new PinModel());
    }
  }

  protected disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    this.contentResizeObserver?.disconnect();
  }

  protected componentDidRender(): void {
    if (this.focused && this.inputEl != null) {
      this.setFocus();
    }
  }

  protected render(): JSX.Element {
    return (
      <Host>
        <div
          id={`pin-label-${this.pin?.id}`}
          class={classNames('pin-label-input-wrapper', {
            focused: this.focused,
          })}
          onPointerDown={this.handlePointerDown}
          style={{
            top: `${this.computedScreenPosition?.y.toString() || 0}px`,
            left: `${this.computedScreenPosition?.x.toString() || 0}px`,
            minWidth: this.computeMinWidth(),
            maxWidth: this.computeMaxWidth(),
            maxHeight: this.computeMaxHeight(),
          }}
        >
          {/* This corrects for a behavior in Firefox where setting the `disabled` attribute to true */}
          {/* prevents any events from propagating. */}
          {!this.focused && (
            <div
              class="pin-input-drag-target"
              onPointerDown={this.handlePointerDown}
            />
          )}
          <textarea
            id={`pin-label-input-${this.pin?.id}`}
            class={classNames('pin-label-input', 'pin-label-text', {
              ['readonly']: !this.focused,
            })}
            disabled={!this.focused}
            ref={(ref) => (this.inputEl = ref)}
            value={this.value}
            rows={this.textareaRows}
            onKeyDown={this.handleInputKeyDown}
            onInput={this.handleTextInput}
            onBlur={this.handleTextBlur}
          />
        </div>
        <div
          ref={(el) => (this.contentEl = el)}
          class={classNames('pin-label-text', 'pin-label-hidden')}
          style={{
            maxWidth: this.computeMaxWidth(),
            maxHeight: this.computeMaxHeight(),
          }}
        >
          {this.hiddenContent()}
        </div>
      </Host>
    );
  }

  private hiddenContent(): Array<string | HTMLBRElement> {
    // This corrects some inconsistencies in how a newline character
    // is represented in a div. Leveraging `<br>`s results in a more
    // consistent representation of the newlines in a textarea.
    return this.value.includes('\n')
      ? this.value
          .split('\n')
          .reduce(
            (res, str) => [...res, str, <br />],
            [] as Array<string | HTMLBRElement>
          )
      : [this.value];
  }

  private computeMinWidth(): string {
    if (this.contentElBounds != null) {
      const expected = `${this.contentElBounds.width + 16}px`;

      return `min(${expected}, ${this.computeMaxWidth()})`;
    } else {
      return `var(--viewer-annotations-pin-label-min-width)`;
    }
  }

  private computeMaxWidth(): string {
    const expected = `var(--viewer-annotations-pin-label-max-width)`;

    return `min(${expected}, ${this.computeRemainingWidth()})`;
  }

  private computeMaxHeight(): string {
    const expected = `var(--viewer-annotations-pin-label-max-height)`;

    return `min(${expected}, ${this.computeRemainingHeight()})`;
  }

  private computeRemainingWidth(): string {
    return `calc(${this.elementBounds?.width.toString() || 0}px - ${
      this.computedScreenPosition?.x.toString() || 0
    }px)`;
  }

  private computeRemainingHeight(): string {
    return `calc(${this.elementBounds?.height.toString() || 0}px - ${
      this.computedScreenPosition?.y.toString() || 0
    }px)`;
  }

  private computeScreenPosition(): void {
    this.computedScreenPosition =
      isTextPin(this.pin) &&
      this.elementBounds != null &&
      this.pin.label.point != null
        ? translatePointToScreen(this.pin.label.point, this.elementBounds)
        : undefined;
  }

  private computeContentSize = (): void => {
    readDOM(() => {
      if (this.contentEl != null) {
        this.contentElBounds = this.contentEl.getBoundingClientRect();
        const computedStyles = getComputedStyle(this.contentEl);
        this.textareaRows = Math.max(
          1,
          Math.ceil(
            (parseFloat(computedStyles.height) -
              parseFloat(computedStyles.borderWidth) * 2) /
              parseFloat(computedStyles.lineHeight)
          )
        );
      }
    });
  };

  private handleInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.submit();
    } else if (event.key === 'Enter') {
      this.textareaRows += 1;
    }
  };

  private handlePointerDown = (event: PointerEvent): void => {
    if (!this.focused) {
      this.pinController?.setSelectedPinId(this.pin?.id);

      if (this.elementBounds != null) {
        this.relativePointerDownPosition = translatePointToRelative(
          getMouseClientPosition(event, this.elementBounds),
          this.elementBounds
        );
        this.pinPointerDownPosition = this.pin?.label.point;

        window.addEventListener('pointermove', this.handlePointerMove);
        window.addEventListener('pointerup', this.handlePointerUp);
      }
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (
      this.elementBounds != null &&
      this.relativePointerDownPosition &&
      this.pinPointerDownPosition != null
    ) {
      const point = getMouseClientPosition(event, this.elementBounds);
      const relative = translatePointToRelative(point, this.elementBounds);

      const relativeDelta = Point.subtract(
        relative,
        this.relativePointerDownPosition
      );

      const myUpdatedPin =
        this.pin != null
          ? {
              id: this.pin.id,
              worldPosition: this.pin.worldPosition,
              label: {
                point: Point.add(this.pinPointerDownPosition, relativeDelta),
                text: this.pin.label.text,
              },
            }
          : undefined;

      if (myUpdatedPin) {
        this.pinController?.setPin(myUpdatedPin);
        this.computeScreenPosition();
      }
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (
      this.pinController?.getToolMode() === 'edit' &&
      this.relativePointerDownPosition != null &&
      this.elementBounds != null
    ) {
      const pointerDownScreen = translatePointToScreen(
        this.relativePointerDownPosition,
        this.elementBounds
      );
      const distanceBetweenStartAndEndPoint = Point.distance(
        pointerDownScreen,
        getMouseClientPosition(event, this.elementBounds)
      );

      if (distanceBetweenStartAndEndPoint <= 2) {
        this.focused = true;
        this.labelFocused.emit(this.pin?.id);
      }
    }

    this.relativePointerDownPosition = undefined;
    this.pinPointerDownPosition = undefined;

    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
  };

  private handleTextBlur = (): void => {
    this.submit();
  };

  private submit(): void {
    this.focused = false;
    this.labelBlurred.emit(this.pin?.id);
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
