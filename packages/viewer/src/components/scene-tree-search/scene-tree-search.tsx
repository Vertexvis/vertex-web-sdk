import {
  Component,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
} from '@stencil/core';
import classNames from 'classnames';

import { debounceEvent } from '../../lib/stencil';

/**
 * @slot search-icon - A slot that replaces the component's default search icon.
 * @slot clear-icon - A slot that replaces the component's default clear icon.
 */
@Component({
  tag: 'vertex-scene-tree-search',
  styleUrl: 'scene-tree-search.css',
  shadow: true,
})
export class SceneTreeSearch {
  /**
   * Specifies the delay, in milliseconds, to emit `search` events after user
   * input.
   */
  @Prop()
  public debounce = 350;

  /**
   * If `true`, disables user interaction of the component.
   */
  @Prop()
  public disabled = false;

  /**
   * Placeholder text if `value` is empty.
   */
  @Prop()
  public placeholder?: string = undefined;

  /**
   * The current text value of the component. Value is updated on user
   * interaction.
   */
  @Prop({ mutable: true })
  public value = '';

  /**
   * An indicator to show if the filter results are loading.
   */
  @Prop({ mutable: true })
  public isSearching?: boolean = false;

  /**
   * An event that is emitted when a user has inputted or cleared the search
   * term. The event may be delayed according to the current `debounce` value.
   */
  @Event({ bubbles: true })
  public search!: EventEmitter<string>;

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

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.handleDebounceChanged();
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="root">
          <div class="overlay icon icon-search">
            <slot name="search-icon">
              {this.isSearching ? (
                <vertex-viewer-spinner size="xs" />
              ) : (
                <vertex-viewer-icon name="search" size="sm" />
              )}
            </slot>
          </div>

          <input
            class={classNames('input', {
              background: this.focused || this.value.length > 0,
            })}
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
