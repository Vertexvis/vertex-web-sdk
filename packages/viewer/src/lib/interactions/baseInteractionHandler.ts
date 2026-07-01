import { Point } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { ConfigProvider } from '../config';
import { getMouseClientPosition } from '../dom';
import { InteractionApi } from './interactionApi';
import { BaseEvent } from './interactionEvent';
import { InteractionHandler } from './interactionHandler';
import {
  MouseInteraction,
  PanInteraction,
  PivotInteraction,
  RotateInteraction,
  RotatePointInteraction,
  TwistInteraction,
  ZoomInteraction,
} from './mouseInteractions';

export type InteractionType =
  | 'rotate'
  | 'zoom'
  | 'pan'
  | 'twist'
  | 'rotate-point'
  | 'pivot';

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 1.2;

export abstract class BaseInteractionHandler implements InteractionHandler {
  protected interactionApi?: InteractionApi;
  protected element?: HTMLElement;
  protected downPosition?: Point.Point;
  private downPositionCanvas?: Point.Point;
  private primaryInteraction: MouseInteraction;
  private currentInteraction?: MouseInteraction;
  private draggingInteraction: MouseInteraction | undefined;
  private lastPrimaryRotateInteraction?: MouseInteraction;
  private isDragging = false;
  private lastMoveEvent?: BaseEvent;
  private interactionTimer?: number;
  private keyboardControls = false;

  protected disableIndividualInteractions = false;

  private bodyStyleCache?: {
    fontSize: number;
    lineHeight: number;
    height: number;
  };

  private primaryInteractionTypeChange = new EventDispatcher<void>();

  public constructor(
    protected downEvent: 'mousedown' | 'pointerdown',
    protected upEvent: 'mouseup' | 'pointerup',
    protected moveEvent: 'mousemove' | 'pointermove',
    private rotateInteraction: RotateInteraction,
    private rotatePointInteraction: RotatePointInteraction,
    private zoomInteraction: ZoomInteraction,
    private panInteraction: PanInteraction,
    private twistInteraction: TwistInteraction,
    private pivotInteraction: PivotInteraction,
    private getConfig: ConfigProvider
  ) {
    this.primaryInteraction = rotateInteraction;
    this.handleDownEvent = this.handleDownEvent.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.handleWindowMove = this.handleWindowMove.bind(this);
    this.handleWindowUp = this.handleWindowUp.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;
    element.addEventListener(this.downEvent, this.handleDownEvent);
    element.addEventListener('mousedown', this.handleDoubleClick);
    element.addEventListener('wheel', this.handleMouseWheel, {
      passive: false,
    });
  }

  public dispose(): void {
    this.element?.removeEventListener(this.downEvent, this.handleDownEvent);
    this.element?.removeEventListener('mousedown', this.handleDoubleClick);
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
      case 'rotate-point':
        this.currentInteraction = this.rotatePointInteraction;
        break;
      case 'pivot':
        this.currentInteraction = this.pivotInteraction;
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
        this.lastPrimaryRotateInteraction = this.rotateInteraction;
        break;
      case 'rotate-point':
        this.primaryInteraction = this.rotatePointInteraction;
        this.lastPrimaryRotateInteraction = this.rotatePointInteraction;
        break;
      case 'zoom':
        this.primaryInteraction = this.zoomInteraction;
        break;
      case 'pan':
        this.primaryInteraction = this.panInteraction;
        break;
      case 'pivot':
        this.primaryInteraction = this.pivotInteraction;
        break;
    }
    this.primaryInteractionTypeChange.emit();
  }

  public setDefaultKeyboardControls(keyboardControls: boolean): void {
    this.keyboardControls = keyboardControls;
  }

  protected handleDownEvent(event: BaseEvent): void {
    // Prevent selection of any text while interacting with the model.
    event.preventDefault();

    this.interactionTimer = window.setTimeout(() => {
      this.downPosition = Point.create(event.screenX, event.screenY);
      this.downPositionCanvas = this.getCanvasPosition(event);
      this.interactionTimer = undefined;

      // Perform the current movement in the case that the interaction timer elapses
      if (this.lastMoveEvent != null) {
        this.handleWindowMove(this.lastMoveEvent);
      }
    }, this.getConfig().interactions.interactionDelay);

    window.addEventListener(this.moveEvent, this.handleWindowMove);
    window.addEventListener(this.upEvent, this.handleWindowUp);
  }

  protected handleWindowMove(event: BaseEvent): void {
    if (this.interactionTimer == null) {
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

    this.lastMoveEvent = event;
  }

  protected async handleWindowUp(event: BaseEvent): Promise<void> {
    if (this.isDragging) {
      this.endDrag(event);
      this.isDragging = false;
    }

    if (this.interactionTimer != null) {
      window.clearTimeout(this.interactionTimer);
      this.interactionTimer = undefined;
    }

    window.removeEventListener(this.moveEvent, this.handleWindowMove);
    window.removeEventListener(this.upEvent, this.handleWindowUp);
    this.lastMoveEvent = undefined;
  }

  protected async handleDoubleClick(event: BaseEvent): Promise<void> {
    // event.detail is the number of clicks that have happened recently. If the number is 2, then the user double clicked.
    if (
      event.detail === 2 &&
      event.buttons === 4 &&
      this.interactionApi != null
    ) {
      await this.interactionApi.viewAll();
    }
  }

  protected beginDrag(event: BaseEvent): void {
    if (this.keyboardControls && event.metaKey && event.shiftKey) {
      this.currentInteraction = this.rotatePointInteraction;
    } else if (this.keyboardControls && event.shiftKey && event.altKey) {
      this.currentInteraction = this.twistInteraction;
    } else if (this.keyboardControls && event.shiftKey) {
      this.currentInteraction = this.zoomInteraction;
    } else if (this.keyboardControls && (event.metaKey || event.ctrlKey)) {
      this.currentInteraction = this.panInteraction;
    } else if (this.keyboardControls && event.altKey) {
      this.currentInteraction = this.rotateInteraction;
    }

    if (event.buttons === 1) {
      this.draggingInteraction =
        this.currentInteraction || this.primaryInteraction;
    } else if (event.buttons === 2) {
      this.draggingInteraction = this.panInteraction;
    } else if (event.buttons === 4) {
      this.draggingInteraction =
        this.lastPrimaryRotateInteraction ?? this.rotateInteraction;
    }

    if (
      this.draggingInteraction != null &&
      this.interactionApi != null &&
      this.element != null
    ) {
      // Ensure any scroll wheel interactions have been ended prior to beginning
      // another interaction to prevent the interaction from being ended early.
      this.zoomInteraction.endDrag(event, this.interactionApi);

      this.draggingInteraction.beginDrag(
        event,
        this.downPositionCanvas || Point.create(event.clientX, event.clientY),
        this.interactionApi,
        this.element
      );
    }
  }

  protected drag(event: BaseEvent): void {
    if (this.keyboardControls && event.altKey && event.shiftKey) {
      this.currentInteraction = this.twistInteraction;
    } else {
      this.currentInteraction = undefined;
    }
    this.draggingInteraction =
      this.currentInteraction ||
      this.draggingInteraction ||
      this.primaryInteraction;
    if (this.draggingInteraction != null && this.interactionApi != null) {
      this.draggingInteraction.drag(event, this.interactionApi);
    }
  }

  protected endDrag(event: BaseEvent): void {
    if (
      this.keyboardControls &&
      this.currentInteraction === this.twistInteraction
    ) {
      this.currentInteraction = undefined;
    }

    if (this.draggingInteraction != null && this.interactionApi != null) {
      this.draggingInteraction.endDrag(event, this.interactionApi);
      this.draggingInteraction = undefined;
    }
  }

  protected handleMouseWheel(event: WheelEvent): void {
    event.preventDefault();

    if (
      this.element != null &&
      this.interactionApi != null &&
      event.buttons !== 4
    ) {
      const delta =
        -this.wheelDeltaToPixels(event.deltaY, event.deltaMode) / 10;
      const rect = this.element.getBoundingClientRect();
      const point = getMouseClientPosition(event, rect);
      const scrollSize = Math.abs(event.deltaY);

      if (scrollSize < 12) {
        // For small wheel movements, send a single zoom event.
        void this.zoomInteraction.zoomToPoint(
          point,
          delta,
          this.interactionApi
        );
      } else {
        const divisions = Math.min(10, Math.ceil(scrollSize / 12));
        const zoomDelta = delta / divisions;
        // For larger wheel movements, divide the delta into multiple zoom events with increasing delay
        // which approximates a smooth zoom deceleration curve for the end user.
        for (let i = 1; i <= divisions; i++) {
          const delayMs = i * 5;
          window.setTimeout(() => {
            if (this.interactionApi != null) {
              this.zoomInteraction.zoomToPoint(
                point,
                zoomDelta,
                this.interactionApi,
                delayMs
              );
            }
          }, delayMs);
        }
      }
    }
  }

  protected wheelDeltaToPixels(deltaY: number, deltaMode: number): number {
    // Cached values are an optimization we can use given mouseWheel
    // events can happen dozen or hundreds of times per scroll, but body style
    // is very unlikely to change frequently or while doing wheel movements.
    if (this.bodyStyleCache == null) {
      const bodyStyle = window.getComputedStyle(document.body);
      this.bodyStyleCache = {
        fontSize:
          parseFloat(bodyStyle.getPropertyValue('fontSize')) ||
          DEFAULT_FONT_SIZE,
        lineHeight:
          parseFloat(bodyStyle.getPropertyValue('lineHeight')) ||
          DEFAULT_LINE_HEIGHT,
        height:
          parseFloat(bodyStyle.getPropertyValue('height')) ||
          window.innerHeight,
      };
      window.setTimeout(() => {
        this.bodyStyleCache = undefined;
      }, 4800); // For now hardcoded. Could be derived. eg mouseWheelInteractionEndDebounce * 12
    }

    if (deltaMode === 1) {
      // deltaMode 1 corresponds to DOM_DELTA_LINE, which computes deltas in lines
      return (
        deltaY * (this.bodyStyleCache.fontSize * this.bodyStyleCache.lineHeight)
      );
    } else if (deltaMode === 2) {
      // deltaMode 2 corresponds to DOM_DELTA_PAGE, which computes deltas in pages
      return deltaY * this.bodyStyleCache.height;
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
