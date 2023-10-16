import {
  Component,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { debounceEvent } from '../../lib/stencil';
import { SceneTreeController } from '../scene-tree/lib/controller';

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
   *
   * If this value is specified, searches will automatically occur after a
   * keystroke has occurred and the debounce threshold has elapsed.
   *
   * Defaults to `undefined`, and searches only occur on an `Enter` press
   * or a `blur` event.
   */
  @Prop()
  public debounce?: number;

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
   * The scene tree controller
   */
  @Prop()
  public controller?: SceneTreeController;

  /**
   * The current text value of the component. Value is updated on user
   * interaction.
   */
  @Prop({ mutable: true })
  public value = '';

  /**
   * An event that is emitted when a user has inputted or cleared the search
   * term. The event may be delayed according to the current `debounce` value.
   */
  @Event({ bubbles: true })
  public search!: EventEmitter<string>;

  @State()
  private focused = false;

  @State()
  private isSearching = false;

  private lastEmittedValue?: string;
  private inputEl?: HTMLInputElement;
  private onStateChangeDisposable?: Disposable;
  private searchDisposable?: Disposable;

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
  @Watch('controller')
  public controllerChanged(controller: SceneTreeController): void {
    this.setupController();
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.handleDebounceChanged();

    this.setupController();
  }

  /**
   * @ignore
   */
  protected disconnectedCallback(): void {
    this.onStateChangeDisposable?.dispose();
  }

  /**
   * Clears the current search term and clears any debounced filters.
   */
  @Method()
  public async clear(): Promise<void> {
    this.value = '';
    this.searchDisposable?.dispose();
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
                <vertex-viewer-spinner slot="search-icon" size="xs" />
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
            onKeyPress={this.handleKeyPress}
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

    if (this.debounce != null || this.value === '') {
      this.emitCurrentValue();
    }
  };

  private handleTextFocus = (): void => {
    this.focused = true;
  };

  private handleTextBlur = (): void => {
    this.focused = false;

    this.searchDisposable?.dispose();

    if (this.value !== this.lastEmittedValue) {
      this.emitCurrentValue();
    }
  };

  private handleKeyPress = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.searchDisposable?.dispose();
      this.emitCurrentValue();
    }
  };

  private handleClear = (event: MouseEvent): void => {
    event.preventDefault();

    this.value = '';
    this.searchDisposable?.dispose();
    this.emitCurrentValue();
    this.setFocus();
  };

  private handleDebounceChanged(): void {
    this.searchDisposable?.dispose();

    const emitter = debounceEvent(this.search, this.debounce ?? 0);

    // Track this emitter in two separate variables to maintain the `EventEmitter` typing for
    // `this.search`. This allows for correct generation of `CustomEvent` types.
    this.search = emitter;
    this.searchDisposable = emitter;
  }

  private setupController(): void {
    this.onStateChangeDisposable?.dispose();

    this.onStateChangeDisposable = this.controller?.onStateChange.on(
      (state) => {
        this.isSearching = state.isSearching;
      }
    );
  }

  private emitCurrentValue(): void {
    this.lastEmittedValue = this.value;
    this.search.emit(this.value);
  }
}
