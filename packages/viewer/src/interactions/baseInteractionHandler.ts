import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';
import { BaseEvent } from './interactionEvent';

import {
  RotateInteraction,
  ZoomInteraction,
  PanInteraction,
  MouseInteraction,
} from './mouseInteractions';

import { Point } from '@vertexvis/geometry';
import { EventDispatcher, Disposable, Listener } from '@vertexvis/utils';

type InteractionType = 'rotate' | 'zoom' | 'pan';

const SCROLL_WHEEL_DELTA_PERCENTAGES = [0.2, 0.15, 0.25, 0.25, 0.15];
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 1.2;

export abstract class BaseInteractionHandler implements InteractionHandler {
  protected element?: HTMLElement;
  protected interactionApi?: InteractionApi;

  private primaryInteraction: MouseInteraction = this.rotateInteraction;
  private primaryInteractionType: InteractionType = 'rotate';
  private draggingInteraction: MouseInteraction | undefined;

  private downPosition?: Point.Point;
  private isDragging = false;

  private computedBodyStyle?: CSSStyleDeclaration;

  private primaryInteractionTypeChange = new EventDispatcher<void>();

  private currentPosition1?: Point.Point;
  private currentPosition2?: Point.Point;
  private touchPoints: Record<string, Point.Point> = {};

  public constructor(
    protected downEvent: 'mousedown' | 'pointerdown',
    protected upEvent: 'mouseup' | 'pointerup',
    protected moveEvent: 'mousemove' | 'pointermove',
    private rotateInteraction: RotateInteraction,
    private zoomInteraction: ZoomInteraction,
    private panInteraction: PanInteraction
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

  public getPrimaryInteractionType(): InteractionType {
    return this.primaryInteractionType;
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

  protected handleDownEvent(event: BaseEvent): void {
    event.preventDefault();
    const pointer = event as PointerEvent;
    this.downPosition = Point.create(event.screenX, event.screenY);
    if (pointer.pointerId != null) {
      this.touchPoints = {
        ...this.touchPoints,
        [pointer.pointerId]: this.downPosition,
      };
    }

    window.addEventListener(this.moveEvent, this.handleWindowMove);
    window.addEventListener(this.upEvent, this.handleWindowUp);
  }

  protected handleWindowMove(event: BaseEvent): void {
    const position = Point.create(event.screenX, event.screenY);
    let didBeginDrag = false;

    const keys = Object.keys(this.touchPoints);
    const pointer = event as PointerEvent;
    if (
      pointer.pointerId != null &&
      this.touchPoints[pointer.pointerId] != null
    ) {
      this.touchPoints[pointer.pointerId] = position;
    }
    if (keys.length === 2) {
      this.handleTwoPointTouchMove(
        this.touchPoints[keys[0]],
        this.touchPoints[keys[1]]
      );
    } else {
      if (
        this.downPosition != null &&
        Point.distance(position, this.downPosition) >= 2 &&
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
  }

  protected async handleWindowUp(event: BaseEvent): Promise<void> {
    if (this.isDragging) {
      this.endDrag(event);
      this.isDragging = false;
    }

    const pointer = event as PointerEvent;
    if (pointer.pointerId != null) {
      this.interactionApi?.endInteraction();
      this.touchPoints = {};
      this.currentPosition1 = undefined;
      this.currentPosition2 = undefined;
    }

    window.removeEventListener(this.moveEvent, this.handleWindowMove);
    window.removeEventListener(this.upEvent, this.handleWindowUp);
  }

  protected beginDrag(event: BaseEvent): void {
    if (event.buttons === 1) {
      this.draggingInteraction = this.primaryInteraction;
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

  private handleTwoPointTouchMove(
    point1: Point.Point,
    point2: Point.Point
  ): void {
    if (this.currentPosition1 != null && this.currentPosition2 != null) {
      const delta = Point.scale(
        Point.add(
          Point.subtract(point1, this.currentPosition1),
          Point.subtract(point2, this.currentPosition2)
        ),
        0.25,
        0.25
      );
      const distance =
        Point.distance(point1, point2) -
        Point.distance(this.currentPosition1, this.currentPosition2);
      const zoom = distance * 0.5;
      this.interactionApi?.beginInteraction();
      this.interactionApi?.zoomCamera(zoom);
      this.interactionApi?.panCamera(delta);
    }

    this.currentPosition1 = point1;
    this.currentPosition2 = point2;
  }
}
