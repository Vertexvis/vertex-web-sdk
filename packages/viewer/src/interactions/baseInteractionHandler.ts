import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';
import { BaseEvent } from './interactionEvent';

import {
  RotateInteraction,
  ZoomInteraction,
  PanInteraction,
  MouseInteraction,
  TwistInteraction,
} from './mouseInteractions';

import { Point } from '@vertexvis/geometry';
import { EventDispatcher, Disposable, Listener } from '@vertexvis/utils';

export type InteractionType = 'rotate' | 'zoom' | 'pan' | 'twist';

const SCROLL_WHEEL_DELTA_PERCENTAGES = [0.2, 0.15, 0.25, 0.25, 0.15];
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 1.2;

export abstract class BaseInteractionHandler implements InteractionHandler {
  protected interactionApi?: InteractionApi;
  protected element?: HTMLElement;
  protected downPosition?: Point.Point;
  private primaryInteraction: MouseInteraction = this.rotateInteraction;
  private currentInteraction?: MouseInteraction;
  private draggingInteraction: MouseInteraction | undefined;
  private isDragging = false;

  protected disableIndividualInteractions = false;

  private computedBodyStyle?: CSSStyleDeclaration;

  private primaryInteractionTypeChange = new EventDispatcher<void>();

  public constructor(
    protected downEvent: 'mousedown' | 'pointerdown',
    protected upEvent: 'mouseup' | 'pointerup',
    protected moveEvent: 'mousemove' | 'pointermove',
    private rotateInteraction: RotateInteraction,
    private zoomInteraction: ZoomInteraction,
    private panInteraction: PanInteraction,
    private twistInteraction: TwistInteraction
  ) {
    this.handleDownEvent = this.handleDownEvent.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.handleWindowMove = this.handleWindowMove.bind(this);
    this.handleWindowUp = this.handleWindowUp.bind(this);
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;
    element.addEventListener(this.downEvent, this.handleDownEvent);
    element.addEventListener('wheel', this.handleMouseWheel);
  }

  public dispose(): void {
    this.element?.removeEventListener(this.downEvent, this.handleDownEvent);
    this.element?.removeEventListener('wheel', this.handleMouseWheel);
    this.element = undefined;
  }

  public onPrimaryInteractionTypeChange(listener: Listener<void>): Disposable {
    return this.primaryInteractionTypeChange.on(listener);
  }

  public setCurrentInteractionType(type?: InteractionType): void {
    switch (type) {
      case 'rotate':
        this.currentInteraction = this.rotateInteraction;
        break;
      case 'zoom':
        this.currentInteraction = this.zoomInteraction;
        break;
      case 'pan':
        this.currentInteraction = this.panInteraction;
        break;
      case 'twist':
        this.currentInteraction = this.twistInteraction;
        break;
      default:
        this.currentInteraction = undefined;
    }

    if (this.draggingInteraction) {
      const point = this.draggingInteraction.getPosition();
      this.draggingInteraction =
        this.currentInteraction || this.primaryInteraction;
      this.interactionApi?.resetLastAngle();
      this.draggingInteraction.setPosition(point);
    }
  }

  public getPrimaryInteractionType(): InteractionType {
    return this.primaryInteraction.getType();
  }

  public getCurrentInteractionType(): InteractionType {
    return (this.currentInteraction || this.primaryInteraction).getType();
  }

  public setPrimaryInteractionType(type: InteractionType): void {
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

  protected handleDownEvent(event: BaseEvent): void {
    event.preventDefault();
    this.downPosition = Point.create(event.screenX, event.screenY);

    window.addEventListener(this.moveEvent, this.handleWindowMove);
    window.addEventListener(this.upEvent, this.handleWindowUp);
  }

  protected handleWindowMove(event: BaseEvent): void {
    if (this.disableIndividualInteractions) {
      return;
    }

    const position = Point.create(event.screenX, event.screenY);
    const pixelThreshold =
      this.interactionApi != null
        ? this.interactionApi.pixelThreshold(this.isTouch(event))
        : 2;
    if (
      this.downPosition != null &&
      Point.distance(position, this.downPosition) >= pixelThreshold &&
      !this.isDragging
    ) {
      this.beginDrag(event);
      this.isDragging = true;
    }

    if (this.isDragging) {
      this.drag(event);
    }
  }

  protected async handleWindowUp(event: BaseEvent): Promise<void> {
    if (this.isDragging) {
      this.endDrag(event);
      this.isDragging = false;
    }

    window.removeEventListener(this.moveEvent, this.handleWindowMove);
    window.removeEventListener(this.upEvent, this.handleWindowUp);
  }

  protected beginDrag(event: BaseEvent): void {
    if (event.buttons === 1) {
      this.draggingInteraction =
        this.currentInteraction || this.primaryInteraction;
    } else if (event.buttons === 2) {
      this.draggingInteraction = this.panInteraction;
    }

    if (this.draggingInteraction != null && this.interactionApi != null) {
      this.draggingInteraction.beginDrag(event, this.interactionApi);
    }
  }

  protected drag(event: BaseEvent): void {
    if (this.draggingInteraction != null && this.interactionApi != null) {
      this.draggingInteraction.drag(event, this.interactionApi);
    }
  }

  protected endDrag(event: BaseEvent): void {
    if (this.draggingInteraction != null && this.interactionApi != null) {
      this.draggingInteraction.endDrag(event, this.interactionApi);
      this.draggingInteraction = undefined;
    }
  }

  protected handleMouseWheel(event: WheelEvent): void {
    event.preventDefault();

    SCROLL_WHEEL_DELTA_PERCENTAGES.forEach((percentage, index) => {
      const delta =
        -this.wheelDeltaToPixels(event.deltaY, event.deltaMode) / 10;

      window.setTimeout(() => {
        if (this.interactionApi != null) {
          this.zoomInteraction.zoom(delta * percentage, this.interactionApi);
        }
      }, index * 2);
    });
  }

  protected wheelDeltaToPixels(deltaY: number, deltaMode: number): number {
    if (this.computedBodyStyle == null) {
      this.computedBodyStyle = window.getComputedStyle(document.body);
    }

    const defaultLineHeight =
      this.computedBodyStyle.fontSize != null &&
      this.computedBodyStyle.fontSize !== '' &&
      !isNaN(parseFloat(this.computedBodyStyle.fontSize))
        ? parseFloat(this.computedBodyStyle.fontSize) * DEFAULT_LINE_HEIGHT
        : DEFAULT_FONT_SIZE * DEFAULT_LINE_HEIGHT;

    if (deltaMode === 1) {
      // deltaMode 1 corresponds to DOM_DELTA_LINE, which computes deltas in lines
      return this.computedBodyStyle.lineHeight != null &&
        this.computedBodyStyle.lineHeight !== '' &&
        !isNaN(parseFloat(this.computedBodyStyle.lineHeight))
        ? deltaY * parseFloat(this.computedBodyStyle.lineHeight)
        : deltaY * defaultLineHeight;
    } else if (deltaMode === 2) {
      // deltaMode 2 corresponds to DOM_DELTA_PAGE, which computes deltas in pages
      return this.computedBodyStyle.height != null &&
        this.computedBodyStyle.height !== '' &&
        !isNaN(parseFloat(this.computedBodyStyle.height))
        ? deltaY * parseFloat(this.computedBodyStyle.height)
        : deltaY * window.innerHeight;
    }
    // deltaMode 0 corresponds to DOM_DELTA_PIXEL, which computes deltas in pixels
    return deltaY;
  }

  protected getCanvasPosition(event: BaseEvent): Point.Point | undefined {
    const canvasBounds = this.element?.getBoundingClientRect();
    const canvasOffset =
      canvasBounds != null
        ? Point.create(canvasBounds.left, canvasBounds.top)
        : undefined;

    return canvasOffset != null
      ? Point.subtract(Point.create(event.clientX, event.clientY), canvasOffset)
      : undefined;
  }

  protected isTouch(event: BaseEvent): boolean {
    return window.PointerEvent != null && event instanceof PointerEvent
      ? event.pointerType === 'touch'
      : false;
  }
}
