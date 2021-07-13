import {
  Component,
  Host,
  h,
  Prop,
  EventEmitter,
  Event,
  State,
  Method,
} from '@stencil/core';
import classNames from 'classnames';
import { debounceEvent } from '../../lib/stencil';

@Component({
  tag: 'vertex-scene-tree-search',
  styleUrl: 'scene-tree-search.css',
  shadow: true,
})
export class SceneTreeSearch {
  @Prop()
  public debounce = 250;

  @Prop()
  public disabled = false;

  @Prop()
  public placeholder?: string = undefined;

  @Prop({ mutable: true })
  public value = '';

  @Event({ bubbles: true })
  public search!: EventEmitter<string>;

  @State()
  private focused = false;

  private inputEl?: HTMLInputElement;

  @Method()
  public async setFocus(): Promise<void> {
    // HTMLInputElement.focus() doesn't exist in tests.
    if (typeof this.inputEl?.focus === 'function') {
      this.inputEl?.focus();
    }
  }

  protected componentDidLoad(): void {
    this.handleDebounceChanged();
  }

  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="root">
          <div class="overlay icon icon-search">
            <slot name="search-icon">
              <vertex-viewer-icon name="search" size="sm" />
            </slot>
          </div>

          <input
            class={classNames('input', { focused: this.focused })}
            type="text"
            ref={(ref) => (this.inputEl = ref)}
            placeholder={this.placeholder}
            disabled={this.disabled}
            value={this.value}
            onInput={this.handleTextInput}
            onFocus={this.handleTextFocus}
            onBlur={this.handleTextBlur}
          />

          <div
            class={classNames('overlay overlay-clear', {
              show: this.value.length > 0,
            })}
          >
            <button
              class="clear-btn icon"
              tabIndex={-1}
              onMouseDown={this.handleClear}
              disabled={this.disabled}
            >
              <slot name="clear-icon">
                <vertex-viewer-icon name="close-circle" size="sm" />
              </slot>
            </button>
          </div>
        </div>
      </Host>
    );
  }

  private handleTextInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.search.emit(this.value);
  };

  private handleTextFocus = (): void => {
    this.focused = true;
  };

  private handleTextBlur = (): void => {
    this.focused = false;
  };

  private handleClear = (event: MouseEvent): void => {
    event.preventDefault();

    this.value = '';
    this.search.emit(this.value);
    this.setFocus();
  };

  private handleDebounceChanged(): void {
    this.search = debounceEvent(this.search, this.debounce);
  }
}
