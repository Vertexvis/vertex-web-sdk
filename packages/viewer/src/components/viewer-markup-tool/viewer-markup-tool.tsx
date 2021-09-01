import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { stampTemplateWithId } from '../../lib/templates';
import { isVertexViewerDistanceMeasurement } from '../viewer-measurement-distance/utils';
import { isVertexViewerArrowMarkup } from '../viewer-markup-arrow/utils';
import { ArrowMarkup, Markup } from '../../lib/types/markup';

/**
 * The types of measurements that can be performed by this tool.
 */
export type ViewerMarkupToolType = 'arrow' /* | 'circle' */;

interface StateMap {
  markupElement?: HTMLVertexViewerMarkupArrowElement;
}

@Component({
  tag: 'vertex-viewer-markup-tool',
  styleUrl: 'viewer-markup-tool.css',
  shadow: true,
})
export class ViewerMarkupTool {
  /**
  //  * An ID to an HTML template that describes the HTML content to use for
  //  * distance measurements. It's expected that the template contains a
  //  * `<vertex-viewer-measurement-distance>`.
  //  *
  //  * This property will automatically be set when a child of a
  //  * `<vertex-viewer-measurements>` element.
  //  */
  // @Prop()
  // public distanceTemplateId?: string;
  @Prop()
  public arrowTemplateId?: string;

  /**
   * The type of measurement.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-measurements>` element.
   */
  @Prop()
  public tool: ViewerMarkupToolType = 'arrow';

  /**
   * Disables measurements.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-measurements>` element.
   */
  @Prop()
  public disabled = false;

  /**
   * The viewer to connect to measurements.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-measurements>` or `<vertex-viewer>` element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Event({ bubbles: true })
  public markupBegin!: EventEmitter<void>;

  @Event({ bubbles: true })
  public markupEnd!: EventEmitter<Markup>;

  @Element()
  private hostEl!: HTMLElement;

  /**
   * Captures internal state that you want to preserve across dev refreshes, but
   * don't want to trigger a render when the state changes.
   */
  @State()
  private stateMap: StateMap = {};

  @State()
  private isMarkingUp = false;

  @Watch('viewer')
  protected handleViewerChanged(): void {
    if (this.stateMap.markupElement != null) {
      this.stateMap.markupElement.viewer = this.viewer;
    }
  }

  /**
   * @ignore
   */
  @Watch('tool')
  protected handleToolChanged(): void {
    this.updateMarkupElement();
  }

  /**
   * @ignore
   */
  @Watch('arrowTemplateId')
  protected handleDistanceTemplateIdChanged(): void {
    this.updateMarkupElement();
  }

  /**
   * @ignore
   */
  @Watch('disabled')
  protected handleDisabledChanged(): void {
    this.updateMarkupElement();
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.updateMarkupElement();
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    if (!this.disabled) {
      if (this.tool === 'arrow') {
        return (
          <Host>
            <vertex-viewer-layer>
              <slot />
            </vertex-viewer-layer>
          </Host>
        );
      } else {
        return <Host>{`Unsupported tool type '${this.tool}'.`}</Host>;
      }
    } else {
      return <Host></Host>;
    }
  }

  private createArrowMarkupElement(): HTMLVertexViewerMarkupArrowElement {
    if (this.arrowTemplateId != null) {
      const element = stampTemplateWithId(
        window.document.body,
        this.arrowTemplateId,
        isVertexViewerArrowMarkup,
        () =>
          console.warn(
            `Arrow template with ID ${this.arrowTemplateId} not found. Using default arrow element.`
          ),
        () =>
          console.warn(
            `Arrow template does not contain a vertex-viewer-markup-arrow. Using default arrow element.`
          )
      );

      if (element != null) {
        return element;
      }
    }

    return document.createElement('vertex-viewer-markup-arrow');
  }

  private updateMarkupElement(): void {
    console.log('updating');
    const { markupElement } = this.stateMap;
    if (markupElement != null) {
      markupElement.remove();
      markupElement.viewer = undefined;
      markupElement.removeEventListener(
        'editBegin',
        this.handleMarkupEditBegin
      );
      markupElement.removeEventListener('editEnd', this.handleMarkupEditEnd);
    }

    if (!this.disabled) {
      const newMarkupElement = this.createArrowMarkupElement();
      newMarkupElement.mode = 'replace';
      newMarkupElement.viewer = this.viewer;
      newMarkupElement.addEventListener(
        'editBegin',
        this.handleMarkupEditBegin
      );
      newMarkupElement.addEventListener('editEnd', this.handleMarkupEditEnd);
      this.stateMap.markupElement = newMarkupElement;
      this.hostEl.append(newMarkupElement);
    }
  }

  private handleMarkupEditBegin = (): void => {
    this.isMarkingUp = true;
    this.markupBegin.emit();
  };

  private handleMarkupEditEnd = (): void => {
    const { markupElement } = this.stateMap;
    console.log('edit ended', isVertexViewerArrowMarkup(markupElement));
    if (isVertexViewerArrowMarkup(markupElement)) {
      const { start, end } = markupElement;

      this.isMarkingUp = false;
      markupElement.start = undefined;
      markupElement.end = undefined;
      markupElement.mode = 'replace';

      if (start != null && end != null) {
        this.markupEnd.emit(new ArrowMarkup({ start, end }));
      }
    }
  };
}
