import { Point } from '@vertexvis/geometry';
import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';
import { EventDispatcher, Disposable, Listener } from '../utils';
import {
  RotateInteraction,
  ZoomInteraction,
  PanInteraction,
  MouseInteraction,
} from './mouseInteractions';

type InteractionType = 'rotate' | 'zoom' | 'pan';

const SCROLL_WHEEL_DELTA_PERCENTAGES = [0.2, 0.15, 0.25, 0.25, 0.15];
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 1.2;

export class MouseInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private interactionApi?: InteractionApi;

  private primaryInteraction: MouseInteraction = this.rotateInteraction;
  private primaryInteractionType: InteractionType = 'rotate';
  private draggingInteraction: MouseInteraction | undefined;

  private mouseDownPosition?: Point.Point;
  private isDragging = false;

  private computedBodyStyle?: CSSStyleDeclaration;

  private primaryInteractionTypeChange = new EventDispatcher<void>();

  public constructor(
    private rotateInteraction = new RotateInteraction(),
    private zoomInteraction = new ZoomInteraction(),
    private panInteraction = new PanInteraction()
  ) {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.handleWindowMouseMove = this.handleWindowMouseMove.bind(this);
    this.handleWindowMouseUp = this.handleWindowMouseUp.bind(this);
  }

  public dispose(): void {
    this.element?.removeEventListener('mousedown', this.handleMouseDown);
    this.element?.removeEventListener('wheel', this.handleMouseWheel);
    this.element = null;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;

    element.addEventListener('mousedown', this.handleMouseDown);
    element.addEventListener('wheel', this.handleMouseWheel);
  }

  public onPrimaryInteractionTypeChange(listener: Listener<void>): Disposable {
    return this.primaryInteractionTypeChange.on(listener);
  }

  public setPrimaryInteractionType(type: InteractionType): void {
    this.primaryInteractionType = type;
    switch (type) {
      case 'rotate':
        this.primaryInteraction = this.rotateInteraction;
        break;
      case 'zoom':
        this.primaryInteraction = this.zoomInteraction;
        break;
      case 'pan':
        this.primaryInteraction = this.panInteraction;
        break;
    }
    this.primaryInteractionTypeChange.emit();
  }

  public getPrimaryInteractionType(): InteractionType {
    return this.primaryInteractionType;
  }

  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault();

    this.mouseDownPosition = Point.create(event.screenX, event.screenY);

    window.addEventListener('mousemove', this.handleWindowMouseMove);
    window.addEventListener('mouseup', this.handleWindowMouseUp);
  }

  private handleWindowMouseMove(event: MouseEvent): void {
    const mousePosition = Point.create(event.screenX, event.screenY);
    let didBeginDrag = false;

    if (
      Point.distance(mousePosition, this.mouseDownPosition) >= 2 &&
      !this.isDragging
    ) {
      this.beginDrag(event);
      didBeginDrag = true;
      this.isDragging = true;
    }

    // We only invoke drag interactions for mouse events after a beginDrag has
    // been invoked.
    if (!didBeginDrag && this.isDragging) {
      this.drag(event);
    }
  }

  private async handleWindowMouseUp(event: MouseEvent): Promise<void> {
    if (this.isDragging) {
      this.endDrag(event);
      this.isDragging = false;
    }

    window.removeEventListener('mousemove', this.handleWindowMouseMove);
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  private beginDrag(event: MouseEvent): void {
    if (event.buttons === 1) {
      this.draggingInteraction = this.primaryInteraction;
    } else if (event.buttons === 2) {
      this.draggingInteraction = this.panInteraction;
    }

    if (this.draggingInteraction != null) {
      this.draggingInteraction.beginDrag(event, this.interactionApi);
    }
  }

  private drag(event: MouseEvent): void {
    if (this.draggingInteraction != null) {
      this.draggingInteraction.drag(event, this.interactionApi);
    }
  }

  private endDrag(event: MouseEvent): void {
    if (this.draggingInteraction != null) {
      this.draggingInteraction.endDrag(event, this.interactionApi);
      this.draggingInteraction = undefined;
    }
  }

  private handleMouseWheel(event: WheelEvent): void {
    SCROLL_WHEEL_DELTA_PERCENTAGES.forEach((percentage, index) => {
      const delta =
        -this.wheelDeltaToPixels(event.deltaY, event.deltaMode) / 10;

      window.setTimeout(() => {
        this.zoomInteraction.zoom(delta * percentage, this.interactionApi);
      }, index * 2);
    });
  }

  private wheelDeltaToPixels(deltaY: number, deltaMode: number): number {
    if (this.computedBodyStyle == null) {
      this.computedBodyStyle = window.getComputedStyle(document.body);
    }

    const defaultLineHeight =
      this.computedBodyStyle.fontSize != null &&
      this.computedBodyStyle.fontSize !== ''
        ? parseFloat(this.computedBodyStyle.fontSize) * DEFAULT_LINE_HEIGHT
        : DEFAULT_FONT_SIZE * DEFAULT_LINE_HEIGHT;

    if (deltaMode === 1) {
      // deltaMode 1 corresponds to DOM_DELTA_LINE, which computes deltas in lines
      return this.computedBodyStyle.lineHeight != null &&
        this.computedBodyStyle.lineHeight !== ''
        ? deltaY * parseFloat(this.computedBodyStyle.lineHeight)
        : deltaY * defaultLineHeight;
    } else if (deltaMode === 2) {
      // deltaMode 2 corresponds to DOM_DELTA_PAGE, which computes deltas in pages
      return this.computedBodyStyle.height != null &&
        this.computedBodyStyle.height !== ''
        ? deltaY * parseFloat(this.computedBodyStyle.height)
        : deltaY * window.innerHeight;
    }
    // deltaMode 0 corresponds to DOM_DELTA_PIXEL, which computes deltas in pixels
    return deltaY;
  }

  private getCanvasPosition(event: MouseEvent): Point.Point | undefined {
    const canvasBounds = this.element?.getBoundingClientRect();
    const canvasOffset =
      canvasBounds != null
        ? Point.create(canvasBounds.left, canvasBounds.top)
        : undefined;

    return canvasOffset != null
      ? Point.subtract(Point.create(event.clientX, event.clientY), canvasOffset)
      : undefined;
  }
}
