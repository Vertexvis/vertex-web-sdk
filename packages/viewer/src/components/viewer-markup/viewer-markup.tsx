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
  State,
  Watch,
} from '@stencil/core';
import { Dimensions, Point } from '@vertexvis/geometry';

import { stampTemplateWithId } from '../../lib/templates';
import {
  ArrowMarkup,
  CircleMarkup,
  FreeformMarkup,
  Markup,
  MarkupCenteringBehavior,
  MarkupInteraction,
} from '../../lib/types/markup';
import {
  isVertexViewerArrowMarkup,
  LineAnchorStyle,
} from '../viewer-markup-arrow/utils';
import { isVertexViewerCircleMarkup } from '../viewer-markup-circle/utils';
import { isVertexViewerFreeformMarkup } from '../viewer-markup-freeform/utils';
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
   * The original viewport dimensions where this markup was created. This value is used
   * to determine where the markup should be rendered relative to the current viewport,
   * enabling some markup to appear "off-screen".
   *
   * When provided, all NDC values will be considered relative to this viewport.
   */
  @Prop()
  public originatingViewport?: Dimensions.Dimensions;

  /**
   * Defines the behavior of the provided markup when the originating viewport is smaller
   * than the current viewport, or is scaled to a size smaller than the current viewport
   * using the `scale` property.
   *
   * Options:
   * - `x-only`: Markup will be centered horizontally, but not vertically.
   * - `y-only`: Markup will be centered vertically, but not horizontally.
   * - `both`: Markup will be centered both horizontally and vertically.
   * - `none`: Markup will not be centered (default).
   */
  @Prop()
  public centeringBehavior: MarkupCenteringBehavior = 'none';

  /**
   * The current offset of the visible viewport. This value is used to determine where
   * markup should be rendered relative to the current viewport, enabling some markup to appear "off-screen".
   *
   * When provided, all computed coordinates will be offset by this amount.
   */
  @Prop()
  public offset?: Point.Point;

  /**
   * The scale to render this markup at. This value is used to scale the element's bounds
   * along with any `offset` to determine the final computed coordinates.
   *
   * When provided, all computed coordinates will be scaled by this amount.
   */
  @Prop()
  public scale = 1;

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
   * Dispatched when an existing piece of markup is changed, either through user interaction
   * or programmatically.
   */
  @Event()
  public markupChanged!: EventEmitter<
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

  /**
   * Dispatched when markup selection changes. Will either be the
   * selected element or `undefined` indicating that selection
   * was cleared.
   */
  @Event()
  public markupSelectionChanged!: EventEmitter<
    | HTMLVertexViewerMarkupArrowElement
    | HTMLVertexViewerMarkupCircleElement
    | HTMLVertexViewerMarkupFreeformElement
    | undefined
  >;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private toSelectMarkupId?: string;

  @State()
  private pointerDownPosition?: Point.Point;

  protected disconnectedCallback(): void {
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
  }

  /**
   * Adds a new markup as a child to this component. A new markup
   * component will be created from the template specified by
   * `arrow-template-id`, `circle-template-id`, or if undefined
   * a default element will be created.
   *
   * @param markup The markup to add.
   * @returns The markup element that was created.
   * @see {@link arrowTemplateId}
   * @see {@link circleTemplateId}
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
      this.appendMarkupElement(el);
      el.id = id;
      el.start = start;
      el.end = end;
      el.startLineAnchorStyle = this.startLineAnchorStyle;
      el.endLineAnchorStyle = this.endLineAnchorStyle;

      return el;
    } else if (markup instanceof CircleMarkup) {
      const { bounds, id } = markup;

      const el = this.createCircleMarkupElement();
      this.appendMarkupElement(el);
      el.id = id;
      el.bounds = bounds;

      return el;
    } else if (markup instanceof FreeformMarkup) {
      const { bounds, points, id } = markup;

      const el = this.createFreeformMarkupElement();
      this.appendMarkupElement(el);
      el.id = id;
      el.points = points;
      el.bounds = bounds;

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
   * @see {@link getMarkupElement}
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
   * @see {@link getMarkupElements}
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
      if (m.id === this.selectedMarkupId) {
        m.mode = 'edit';
        this.markupSelectionChanged.emit(m);
      } else {
        m.mode = '';
      }
    });

    if (this.selectedMarkupId == null) {
      this.markupSelectionChanged.emit(undefined);
    }
  }

  /**
   * @ignore
   */
  @Watch('arrowTemplateId')
  @Watch('circleTemplateId')
  @Watch('freeformTemplateId')
  @Watch('tool')
  protected handlePropertyChanged(): void {
    this.updatePropsOnMarkupTool();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  @Watch('originatingViewport')
  @Watch('centeringBehavior')
  @Watch('offset')
  @Watch('scale')
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
  @Watch('startLineAnchorStyle')
  protected async handleStartLineAnchorStyleChanged(): Promise<void> {
    this.updatePropsOnMarkupTool();

    // If a piece of arrow markup is currently selected, then update its anchor style
    const selectedArrow = await this.getSelectedArrowMarkup();
    if (selectedArrow != null) {
      selectedArrow.startLineAnchorStyle = this.startLineAnchorStyle;
      this.markupChanged.emit(selectedArrow);
    }
  }

  /**
   * @ignore
   */
  @Watch('endLineAnchorStyle')
  protected async handleEndLineAnchorStyleChanged(): Promise<void> {
    this.updatePropsOnMarkupTool();

    // If a piece of arrow markup is currently selected, then update its anchor style
    const selectedArrow = await this.getSelectedArrowMarkup();

    if (selectedArrow != null) {
      selectedArrow.endLineAnchorStyle = this.endLineAnchorStyle;
      this.markupChanged.emit(selectedArrow);
    }
  }

  /**
   * @ignore
   */
  @Listen('markupEnd')
  protected async handleMarkupEnd(event: CustomEvent<Markup>): Promise<void> {
    const e = event as CustomEvent<Markup>;
    const el = await this.addMarkup(e.detail);

    await new Promise<void>((resolve) => {
      const handleRender = (): void => {
        el.removeEventListener('viewRendered', handleRender);
        resolve();
      };

      el.addEventListener('viewRendered', handleRender);
    });

    if (this.selectNew) {
      this.selectedMarkupId = e.detail.id;
    }

    this.getMarkupTool()?.reset();
  }

  /**
   * @ignore
   */
  @Listen('interactionEnd')
  protected async handleMarkupUpdated(
    event: CustomEvent<MarkupInteraction>
  ): Promise<void> {
    const e = event as CustomEvent<MarkupInteraction>;

    // Do not emit the markupChanged event if the markup was just created
    if (!e.detail.newlyCreatedMarkup) {
      this.markupChanged.emit(e.detail.markup);
    }
  }

  /**
   * @ignore
   */
  @Listen('pointerdown')
  protected async handleMarkupPointerDown(event: PointerEvent): Promise<void> {
    if (!this.disabled) {
      const el = event.target as Element;
      const markups = await this.getMarkupElements();
      const markup = markups.find((m) => m === el);
      if (markup?.id != null && markup?.id !== '') {
        this.toSelectMarkupId = el.id;
      }
      this.pointerDownPosition = Point.create(event.clientX, event.clientY);

      window.addEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('pointerup', this.handlePointerUp);
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
        <slot onSlotchange={this.handleSlotChange} />
      </Host>
    );
  }

  private handleSlotChange = (): void => {
    this.updatePropsOnMarkupTool();
    this.updatePropsOnMarkups();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (
      this.pointerDownPosition != null &&
      Point.distance(
        this.pointerDownPosition,
        Point.create(event.clientX, event.clientY)
      ) > 2
    ) {
      this.toSelectMarkupId = undefined;
    }
  };

  private handlePointerUp = async (event: PointerEvent): Promise<void> => {
    if (!this.disabled) {
      const el = event.target as Element;
      const markups = await this.getMarkupElements();
      const markup = markups.find((m) => m === el);
      if (
        markup?.id != null &&
        markup.id !== '' &&
        markup.id === this.toSelectMarkupId
      ) {
        this.selectedMarkupId = el.id;
      } else if (
        this.pointerDownPosition != null &&
        Point.distance(
          this.pointerDownPosition,
          Point.create(event.clientX, event.clientY)
        ) <= 2
      ) {
        this.selectedMarkupId = undefined;
      }
      this.toSelectMarkupId = undefined;
      this.pointerDownPosition = undefined;
    }

    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
  };

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
    element:
      | HTMLVertexViewerMarkupArrowElement
      | HTMLVertexViewerMarkupCircleElement
      | HTMLVertexViewerMarkupFreeformElement
  ): void {
    element.viewer = this.viewer;
    element.originatingViewport = this.originatingViewport;
    element.centeringBehavior = this.centeringBehavior;
    element.offset = this.offset;
    element.scale = this.scale;
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
      tool.startLineAnchorStyle = this.startLineAnchorStyle;
      tool.endLineAnchorStyle = this.endLineAnchorStyle;
      tool.originatingViewport = this.originatingViewport;
      tool.centeringBehavior = this.centeringBehavior;
      tool.offset = this.offset;
      tool.scale = this.scale;
    }
  }

  private getMarkupTool(): HTMLVertexViewerMarkupToolElement | undefined {
    return this.hostEl.querySelector('vertex-viewer-markup-tool') as
      | HTMLVertexViewerMarkupToolElement
      | undefined;
  }

  private async getSelectedArrowMarkup(): Promise<
    HTMLVertexViewerMarkupArrowElement | undefined
  > {
    if (this.selectedMarkupId != null) {
      const selected = await this.getMarkupElement(this.selectedMarkupId);

      return isVertexViewerArrowMarkup(selected) ? selected : undefined;
    }
  }
}
