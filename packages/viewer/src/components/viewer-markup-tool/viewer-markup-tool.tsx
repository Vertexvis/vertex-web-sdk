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
import { isVertexViewerArrowMarkup } from '../viewer-markup-arrow/utils';
import { ArrowMarkup, CircleMarkup, Markup } from '../../lib/types/markup';
import { isVertexViewerCircleMarkup } from '../viewer-markup-circle/utils';

/**
 * The types of markup that can be performed by this tool.
 */
export type ViewerMarkupToolType = 'arrow' | 'circle';

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
   * Whether camera controls are allowed for the underlying viewer.
   * This defaults to `false`, and is applied to the viewer when this
   * markup tool is enabled.
   */
  @Prop()
  public cameraControls = false;

  /**
   * The viewer to connect to markup.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-markup>` or `<vertex-viewer>` element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

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

  /**
   * An event that is dispatched when a user has cancelled a markup edit.
   */
  @Event({ bubbles: true })
  public markupEditCancel!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  /**
   * Captures internal state that you want to preserve across dev refreshes, but
   * don't want to trigger a render when the state changes.
   */
  @State()
  private stateMap: StateMap = {};

  @State()
  private viewerCameraControls = true;

  @Watch('viewer')
  protected async handleViewerChanged(): Promise<void> {
    if (this.stateMap.markupElement != null) {
      this.stateMap.markupElement.viewer = this.viewer;
      await this.viewer?.addCursor('crosshair');
    }

    if (this.viewer != null) {
      this.viewerCameraControls = this.viewer.cameraControls;
      this.viewer.cameraControls = this.cameraControls;
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

    if (this.viewer != null) {
      console.log(
        this.disabled,
        this.cameraControls,
        this.viewerCameraControls
      );
      this.viewer.cameraControls = this.disabled
        ? this.viewerCameraControls
        : this.cameraControls;
    }
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
      if (this.tool === 'arrow' || this.tool === 'circle') {
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

  private updateMarkupElement(): void {
    const { markupElement } = this.stateMap;
    if (markupElement != null) {
      markupElement.remove();
      markupElement.viewer = undefined;
      markupElement.removeEventListener(
        'editBegin',
        this.handleMarkupEditBegin
      );
      markupElement.removeEventListener('editEnd', this.handleMarkupEditEnd);
      markupElement.removeEventListener(
        'editCancel',
        this.handleMarkupEditCancel
      );
    }

    if (!this.disabled) {
      const newMarkupElement =
        this.tool === 'arrow'
          ? this.createArrowMarkupElement()
          : this.createCircleMarkupElement();
      newMarkupElement.mode = 'replace';
      newMarkupElement.viewer = this.viewer;
      newMarkupElement.addEventListener(
        'editBegin',
        this.handleMarkupEditBegin
      );
      newMarkupElement.addEventListener('editEnd', this.handleMarkupEditEnd);
      newMarkupElement.addEventListener(
        'editCancel',
        this.handleMarkupEditCancel
      );
      this.stateMap.markupElement = newMarkupElement;
      this.hostEl.append(newMarkupElement);
    }
  }

  private handleMarkupEditBegin = (): void => {
    this.markupBegin.emit();
  };

  private handleMarkupEditEnd = (): void => {
    const { markupElement } = this.stateMap;
    if (isVertexViewerCircleMarkup(markupElement)) {
      const { bounds } = markupElement;

      markupElement.bounds = undefined;

      if (bounds != null) {
        this.markupEnd.emit(new CircleMarkup({ bounds }));
      }
    } else if (isVertexViewerArrowMarkup(markupElement)) {
      const { start, end } = markupElement;

      markupElement.start = undefined;
      markupElement.end = undefined;
      markupElement.mode = 'replace';

      if (start != null && end != null) {
        this.markupEnd.emit(new ArrowMarkup({ start, end }));
      }
    }
  };

  private handleMarkupEditCancel = (): void => {
    this.markupEditCancel.emit();
  };
}
