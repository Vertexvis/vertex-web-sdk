import {
  Component,
  Host,
  h,
  Element,
  Prop,
  Watch,
  EventEmitter,
  Event,
  Method,
  Listen,
} from '@stencil/core';
import { stampTemplateWithId } from '../../lib/templates';
import { Markup, ArrowMarkup, CircleMarkup } from '../../lib/types/markup';
import { isVertexViewerArrowMarkup } from '../viewer-markup-arrow/utils';
import { isVertexViewerCircleMarkup } from '../viewer-markup-circle/utils';
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
   * Dispatched when a new markup is added, either through user interaction
   * or programmatically.
   */
  @Event()
  public markupAdded!: EventEmitter<
    HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement
  >;

  /**
   * Dispatched when a markup is removed, either through user
   * interaction or programmatically.
   */
  @Event()
  public markupRemoved!: EventEmitter<
    HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement
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
    HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement
  > {
    if (markup instanceof ArrowMarkup) {
      const { start, end, id } = markup;

      const el = this.createArrowMarkupElement();
      el.id = id;
      el.start = start;
      el.end = end;

      this.updatePropsOnMarkup(el);
      this.hostEl.appendChild(el);
      this.markupAdded.emit(el);
      return el;
    } else if (markup instanceof CircleMarkup) {
      const { bounds, id } = markup;

      const el = this.createCircleMarkupElement();
      el.id = id;
      el.bounds = bounds;

      this.updatePropsOnMarkup(el);
      this.hostEl.appendChild(el);
      return el;
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
    | undefined
  > {
    const markups = await this.getMarkupElements();
    const markup = markups.find((m) => m.id === id);

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
      HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement
    >
  > {
    const circleMarkup = Array.from(this.hostEl.children).filter(
      isVertexViewerCircleMarkup
    );
    const arrowMarkup = Array.from(this.hostEl.children).filter(
      isVertexViewerArrowMarkup
    );

    return [...arrowMarkup, ...circleMarkup];
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
    this.selectedMarkupId = e.detail.id;
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
      tool.tool = this.tool;
      tool.viewer = this.viewer;

      if (this.viewer != null) {
        this.viewer.cameraControls = tool.cameraControls;
      }
    }
  }

  private getMarkupTool(): HTMLVertexViewerMarkupToolElement | undefined {
    return this.hostEl.querySelector('vertex-viewer-markup-tool') as
      | HTMLVertexViewerMarkupToolElement
      | undefined;
  }
}
