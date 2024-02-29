import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';

import { stampTemplateWithId } from '../../lib/templates';
import {
  ArrowMarkup,
  CircleMarkup,
  FreeformMarkup,
  Markup,
} from '../../lib/types/markup';
import {
  isVertexViewerArrowMarkup,
  LineAnchorStyle,
} from '../viewer-markup-arrow/utils';
import { isVertexViewerCircleMarkup } from '../viewer-markup-circle/utils';
import { isVertexViewerFreeformMarkup } from '../viewer-markup-freeform/utils';

/**
 * The types of markup that can be performed by this tool.
 */
export type ViewerMarkupToolType = 'arrow' | 'circle' | 'freeform';

interface StateMap {
  markupElement?:
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupFreeformElement;
}

@Component({
  tag: 'vertex-viewer-markup-tool',
  styleUrl: 'viewer-markup-tool.css',
  shadow: true,
})
export class ViewerMarkupTool {
  /**
   * An HTML template that describes the HTML to use for new arrow
   * markup. It's expected that the template contains a
   * `<vertex-viewer-markup-arrow>`.
   */
  @Prop()
  public arrowTemplateId?: string;

  /**
   * An HTML template that describes the HTML to use for new circle
   * markup. It's expected that the template contains a
   * `<vertex-viewer-markup-circle>`.
   */
  @Prop()
  public circleTemplateId?: string;

  /**
   * An HTML template that describes the HTML to use for new freeform
   * markup. It's expected that the template contains a
   * `<vertex-viewer-markup-freeform>`.
   */
  @Prop()
  public freeformTemplateId?: string;

  /**
   * The type of markup.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-markup>` element.
   */
  @Prop()
  public tool: ViewerMarkupToolType = 'arrow';

  /**
   * Disables markups.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-markup>` element.
   */
  @Prop()
  public disabled = false;

  /**
   * The viewer to connect to markup.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-markup>` or `<vertex-viewer>` element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The style of the starting anchor. This defaults to none.
   */
  @Prop({ mutable: true })
  public startLineAnchorStyle: LineAnchorStyle = 'none';

  /**
   * The style of the ending anchor. This defaults to 'arrow-triangle.'
   */
  @Prop({ mutable: true })
  public endLineAnchorStyle: LineAnchorStyle = 'arrow-triangle';

  /**
   * An event that is dispatched when a user begins a new markup.
   */
  @Event({ bubbles: true })
  public markupBegin!: EventEmitter<void>;

  /**
   * An event that is dispatched when a user has finished their markup.
   */
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

  @Watch('viewer')
  protected async handleViewerChanged(): Promise<void> {
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
  protected handleArrowTemplateIdChanged(): void {
    this.updateMarkupElement();
  }

  /**
   * @ignore
   */
  @Watch('circleTemplateId')
  protected handleCircleTemplateIdChanged(): void {
    this.updateMarkupElement();
  }

  /**
   * @ignore
   */
  @Watch('freeformTemplateId')
  protected handleFreeformTemplateIdChanged(): void {
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
  @Watch('startLineAnchorStyle')
  protected handleStartLineAnchorStyleChanged(): void {
    this.updateMarkupElement();
  }

  /**
   * @ignore
   */
  @Watch('endLineAnchorStyle')
  protected handleEndLineAnchorStyleChanged(): void {
    this.updateMarkupElement();
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.updateMarkupElement();
  }

  /**
   * Resets the state of the internally managed markup element
   * to allow for creating a new markup. This state is automatically
   * managed when this element is placed as a child of a
   * `<vertex-viewer-markup>` element.
   */
  @Method()
  public async reset(): Promise<void> {
    const { markupElement } = this.stateMap;
    if (isVertexViewerFreeformMarkup(markupElement)) {
      markupElement.points = undefined;
      markupElement.bounds = undefined;
      markupElement.mode = 'create';
    } else if (isVertexViewerCircleMarkup(markupElement)) {
      markupElement.bounds = undefined;
      markupElement.mode = 'create';
    } else if (isVertexViewerArrowMarkup(markupElement)) {
      markupElement.start = undefined;
      markupElement.end = undefined;
      markupElement.mode = 'create';
    }
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    if (!this.disabled) {
      if (
        this.tool === 'arrow' ||
        this.tool === 'circle' ||
        this.tool === 'freeform'
      ) {
        return (
          <Host>
            <slot />
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

  private createCircleMarkupElement(): HTMLVertexViewerMarkupCircleElement {
    if (this.circleTemplateId != null) {
      const element = stampTemplateWithId(
        window.document.body,
        this.circleTemplateId,
        isVertexViewerCircleMarkup,
        () =>
          console.warn(
            `Circle template with ID ${this.circleTemplateId} not found. Using default circle element.`
          ),
        () =>
          console.warn(
            `Circle template does not contain a vertex-viewer-markup-circle. Using default circle element.`
          )
      );

      if (element != null) {
        return element;
      }
    }

    return document.createElement('vertex-viewer-markup-circle');
  }

  private createFreeformMarkupElement(): HTMLVertexViewerMarkupFreeformElement {
    if (this.freeformTemplateId != null) {
      const element = stampTemplateWithId(
        window.document.body,
        this.freeformTemplateId,
        isVertexViewerFreeformMarkup,
        () =>
          console.warn(
            `Freeform template with ID ${this.freeformTemplateId} not found. Using default freeform element.`
          ),
        () =>
          console.warn(
            `Freeform template does not contain a vertex-viewer-markup-freeform. Using default freeform element.`
          )
      );

      if (element != null) {
        return element;
      }
    }

    return document.createElement('vertex-viewer-markup-freeform');
  }

  private createNewMarkupElement():
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupFreeformElement {
    switch (this.tool) {
      case 'arrow':
        return this.createArrowMarkupElement();
      case 'circle':
        return this.createCircleMarkupElement();
      case 'freeform':
        return this.createFreeformMarkupElement();
    }
  }

  private updateMarkupElement(): void {
    const { markupElement } = this.stateMap;
    if (markupElement != null) {
      markupElement.remove();
      markupElement.dispose();
      markupElement.viewer = undefined;
      markupElement.removeEventListener(
        'interactionBegin',
        this.handleMarkupInteractionBegin
      );
      markupElement.removeEventListener(
        'interactionEnd',
        this.handleMarkupInteractionEnd
      );
    }

    if (!this.disabled) {
      const newMarkupElement = this.createNewMarkupElement();

      if (this.tool === 'arrow') {
        (
          newMarkupElement as HTMLVertexViewerMarkupArrowElement
        ).startLineAnchorStyle = this.startLineAnchorStyle;
        (
          newMarkupElement as HTMLVertexViewerMarkupArrowElement
        ).endLineAnchorStyle = this.endLineAnchorStyle;
      }

      newMarkupElement.mode = 'create';
      newMarkupElement.viewer = this.viewer;
      newMarkupElement.addEventListener(
        'interactionBegin',
        this.handleMarkupInteractionBegin
      );
      newMarkupElement.addEventListener(
        'interactionEnd',
        this.handleMarkupInteractionEnd
      );
      this.stateMap.markupElement = newMarkupElement;
      this.hostEl.append(newMarkupElement);
    }
  }

  private handleMarkupInteractionBegin = (): void => {
    this.markupBegin.emit();
  };

  private handleMarkupInteractionEnd = (): void => {
    const { markupElement } = this.stateMap;
    if (isVertexViewerFreeformMarkup(markupElement)) {
      const { points, bounds } = markupElement;

      if (points != null && points.length > 0 && bounds != null) {
        this.markupEnd.emit(new FreeformMarkup({ points, bounds }));
      }
    } else if (isVertexViewerCircleMarkup(markupElement)) {
      const { bounds } = markupElement;

      if (bounds != null) {
        this.markupEnd.emit(new CircleMarkup({ bounds }));
      }
    } else if (isVertexViewerArrowMarkup(markupElement)) {
      const { start, end } = markupElement;

      if (start != null && end != null) {
        this.markupEnd.emit(new ArrowMarkup({ start, end }));
      }
    }
  };
}
