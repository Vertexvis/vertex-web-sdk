import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Method,
  Prop,
  Watch,
} from '@stencil/core';

import { stampTemplateWithId } from '../../lib/templates';
import {
  ArrowMarkup,
  CircleMarkup,
  FreeformMarkup,
  Markup,
} from '../../lib/types/markup';
import { isVertexViewerArrowMarkup } from '../viewer-markup-arrow/utils';
import { isVertexViewerCircleMarkup } from '../viewer-markup-circle/utils';
import { isVertexViewerFreeformMarkup } from '../viewer-markup-freeform.tsx/utils';
import { ViewerMarkupToolType } from '../viewer-markup-tool/viewer-markup-tool';

@Component({
  tag: 'vertex-viewer-markup',
  styleUrl: 'viewer-markup.css',
  shadow: true,
})
export class ViewerMarkup {
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
   * The type of markup to perform.
   */
  @Prop()
  public tool: ViewerMarkupToolType = 'arrow';

  /**
   * If `true`, disables adding or editing of markup through user
   * interaction.
   */
  @Prop()
  public disabled = false;

  /**
   * The viewer to connect to markup. If nested within a <vertex-viewer>,
   * this property will be populated automatically.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The ID of the markup that is selected.
   */
  @Prop({ mutable: true })
  public selectedMarkupId?: string;

  /**
   * Indicates if new markup should be automatically selected.
   */
  @Prop()
  public selectNew = false;

  /**
   * Dispatched when a new markup is added, either through user interaction
   * or programmatically.
   */
  @Event()
  public markupAdded!: EventEmitter<
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupFreeformElement
  >;

  /**
   * Dispatched when a markup is removed, either through user
   * interaction or programmatically.
   */
  @Event()
  public markupRemoved!: EventEmitter<
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupFreeformElement
  >;

  @Element()
  private hostEl!: HTMLElement;

  /**
   * Adds a new markup as a child to this component. A new markup
   * component will be created from the template specified by
   * `arrow-template-id`, `circle-template-id`, or if undefined
   * a default element will be created.
   *
   * @param markup The markup to add.
   * @returns The markup element that was created.
   * @see {@link ViewerMarkups.arrowTemplateId}
   * @see {@link ViewerMarkups.circleTemplateId}
   */
  @Method()
  public async addMarkup(
    markup: Markup
  ): Promise<
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupFreeformElement
  > {
    if (markup instanceof ArrowMarkup) {
      const { start, end, id } = markup;

      const el = this.createArrowMarkupElement();
      el.id = id;
      el.start = start;
      el.end = end;

      return this.appendMarkupElement(el);
    } else if (markup instanceof CircleMarkup) {
      const { bounds, id } = markup;

      const el = this.createCircleMarkupElement();
      el.id = id;
      el.bounds = bounds;

      return this.appendMarkupElement(el);
    } else if (markup instanceof FreeformMarkup) {
      const { bounds, points, id } = markup;

      const el = this.createFreeformMarkupElement();
      el.id = id;
      el.points = points;
      el.bounds = bounds;

      return this.appendMarkupElement(el);
    } else {
      throw new Error(`Cannot add markup. Unknown type '${markup}'.`);
    }
  }

  /**
   * Removes a markup with the given ID, and returns the HTML element
   * associated to the markup. Returns `undefined` if no markup is
   * found.
   *
   * @param id The ID of the markup to remove.
   * @returns The markup element, or undefined.
   */
  @Method()
  public async removeMarkup(
    id: string
  ): Promise<
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupFreeformElement
    | undefined
  > {
    const markup = await this.getMarkupElement(id);

    if (markup != null) {
      markup.remove();
      this.markupRemoved.emit(markup);
    }

    return markup;
  }

  /**
   * Returns a list of markup elements that are children of this component.
   *
   * @returns A list of all markups.
   * @see {@link ViewerMarkup.getMarkupElement}
   */
  @Method()
  public async getMarkupElements(): Promise<
    Array<
      | HTMLVertexViewerMarkupArrowElement
      | HTMLVertexViewerMarkupCircleElement
      | HTMLVertexViewerMarkupFreeformElement
    >
  > {
    return Array.from(this.hostEl.children).filter(
      (e) =>
        isVertexViewerArrowMarkup(e) ||
        isVertexViewerCircleMarkup(e) ||
        isVertexViewerFreeformMarkup(e)
    ) as Array<
      | HTMLVertexViewerMarkupArrowElement
      | HTMLVertexViewerMarkupCircleElement
      | HTMLVertexViewerMarkupFreeformElement
    >;
  }

  /**
   * Returns the markup element associated to the given ID.
   *
   * @param id The ID of the markup element to return.
   * @returns A markup element, or `undefined`.
   * @see {@link ViewerMarkup.getMarkupElements}
   */
  @Method()
  public async getMarkupElement(
    id: string
  ): Promise<
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupFreeformElement
    | undefined
  > {
    const markup = await this.getMarkupElements();
    return markup.find((el) => el.id === id);
  }

  /**
   * @ignore
   */
  @Watch('selectedMarkupId')
  protected async handleSelectedMarkupIdChanged(): Promise<void> {
    const markup = await this.getMarkupElements();
    markup.forEach((m) => {
      m.mode = m.id === this.selectedMarkupId ? 'edit' : '';
    });
  }

  /**
   * @ignore
   */
  @Watch('tool')
  protected handleToolChanged(): void {
    this.updatePropsOnMarkupTool();
  }

  /**
   * @ignore
   */
  @Watch('arrowTemplateId')
  protected handleArrowTemplateIdChanged(): void {
    this.updatePropsOnMarkupTool();
  }

  /**
   * @ignore
   */
  @Watch('circleTemplateId')
  protected handleCircleTemplateIdChanged(): void {
    this.updatePropsOnMarkupTool();
  }

  /**
   * @ignore
   */
  @Watch('freeformTemplateId')
  protected handleFreeformTemplateIdChanged(): void {
    this.updatePropsOnMarkupTool();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected async handleViewerChanged(
    newViewer: HTMLVertexViewerElement | undefined
  ): Promise<void> {
    this.updatePropsOnMarkupTool();
    this.updatePropsOnMarkups();
  }

  /**
   * @ignore
   */
  @Watch('disabled')
  protected handleDisabledChanged(): void {
    this.updatePropsOnMarkupTool();
  }

  /**
   * @ignore
   */
  @Listen('markupEnd')
  protected async handleMarkupEnd(event: CustomEvent<Markup>): Promise<void> {
    const e = event as CustomEvent<Markup>;
    await this.addMarkup(e.detail);

    if (this.selectNew) {
      this.selectedMarkupId = e.detail.id;
    }
  }

  /**
   * @ignore
   */
  @Listen('markupEditCancel')
  protected async handleMarkupEditCancel(): Promise<void> {
    this.selectedMarkupId = undefined;
  }

  /**
   * @ignore
   */
  @Listen('pointerdown')
  protected async handleMarkupPointerDown(event: Event): Promise<void> {
    if (!this.disabled) {
      const el = event.target as Element;
      const markups = await this.getMarkupElements();
      const markup = markups.find((m) => m === el);
      if (markup?.id != null && markup?.id !== '') {
        this.selectedMarkupId = el.id;
      }
    }
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.updatePropsOnMarkupTool();
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot />
      </Host>
    );
  }

  private appendMarkupElement(
    el:
      | HTMLVertexViewerMarkupCircleElement
      | HTMLVertexViewerMarkupArrowElement
      | HTMLVertexViewerMarkupFreeformElement
  ):
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupFreeformElement {
    this.updatePropsOnMarkup(el);
    this.hostEl.appendChild(el);
    this.markupAdded.emit(el);

    return el;
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

  private async updatePropsOnMarkups(): Promise<void> {
    const markup = await this.getMarkupElements();
    markup.forEach((m) => this.updatePropsOnMarkup(m));
  }

  private updatePropsOnMarkup(
    element: HTMLVertexViewerMarkupArrowElement
  ): void {
    element.viewer = this.viewer;
    element.classList.add('viewer-markup__markup');
  }

  private updatePropsOnMarkupTool(): void {
    const tool = this.getMarkupTool();
    if (tool != null) {
      tool.disabled = this.disabled;
      tool.arrowTemplateId = this.arrowTemplateId;
      tool.circleTemplateId = this.circleTemplateId;
      tool.freeformTemplateId = this.freeformTemplateId;
      tool.tool = this.tool;
      tool.viewer = this.viewer;
    }
  }

  private getMarkupTool(): HTMLVertexViewerMarkupToolElement | undefined {
    return this.hostEl.querySelector('vertex-viewer-markup-tool') as
      | HTMLVertexViewerMarkupToolElement
      | undefined;
  }
}
