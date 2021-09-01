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
import { Markup, ArrowMarkup } from '../../lib/types/markup';
import { isVertexViewerArrowMarkup } from '../viewer-markup-arrow/utils';
import { ViewerMarkupToolType } from '../viewer-markup-tool/viewer-markup-tool';

@Component({
  tag: 'vertex-viewer-markup',
  styleUrl: 'viewer-markup.css',
  shadow: true,
})
export class ViewerMarkup {
  // /**
  //  * An HTML template that describes the HTML to use for new distance
  //  * measurements. It's expected that the template contains a
  //  * `<vertex-viewer-measurement-distance>`.
  //  */
  @Prop()
  public arrowTemplateId?: string;

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

  @Element()
  private hostEl!: HTMLElement;

  /**
   * Adds a new markup as a child to this component. A new markup
   * component will be created from the template specified by
   * `arrow-template-id` or if undefined a default element will be created.
   *
   * @param markup The markup to add.
   * @returns The markup element that was created.
   * @see {@link ViewerMarkups.arrowTemplateId}
   */
  @Method()
  public async addMarkup(
    markup: Markup
  ): Promise<HTMLVertexViewerMarkupArrowElement> {
    if (markup instanceof ArrowMarkup) {
      const { start, end, id } = markup;

      const el = this.createArrowMarkupElement();
      el.id = id;
      el.start = start;
      el.end = end;

      this.updatePropsOnMarkup(el);
      this.hostEl.appendChild(el);
      // this.markupAdded.emit(el);
      return el;
    } else {
      throw new Error(`Cannot add markup. Unknown type '${markup}'.`);
    }
  }

  /**
   * Returns a list of measurement elements that are children of this component.
   *
   * @returns A list of all measurements.
   * @see {@link ViewerMeasurements.getMeasurementElement}
   */
  @Method()
  public async getMarkupElements(): Promise<
    HTMLVertexViewerMarkupArrowElement[]
  > {
    return Array.from(this.hostEl.children).filter(isVertexViewerArrowMarkup);
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
    console.log(event);
    const e = event as CustomEvent<Markup>;
    await this.addMarkup(e.detail);
    this.selectedMarkupId = e.detail.id;
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

  private async updatePropsOnMarkups(): Promise<void> {
    const markup = await this.getMarkupElements();
    markup.forEach((m) => this.updatePropsOnMarkup(m));
  }

  private updatePropsOnMarkup(
    element: HTMLVertexViewerMarkupArrowElement
  ): void {
    console.log(this.viewer);
    element.viewer = this.viewer;
    element.classList.add('viewer-markup__markup');
  }

  private updatePropsOnMarkupTool(): void {
    const tool = this.getMarkupTool();
    console.log(this.viewer);
    if (tool != null) {
      tool.disabled = this.disabled;
      tool.arrowTemplateId = this.arrowTemplateId;
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
