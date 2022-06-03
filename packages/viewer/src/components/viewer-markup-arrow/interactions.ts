import type { EventEmitter } from '@stencil/core';
import { Point } from '@vertexvis/geometry';

import { getMouseClientPosition } from '../../lib/dom';
import { MarkupInteractionHandler } from '../../lib/markup/interactions';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';

type ViewerMarkupArrowEditAnchor = 'start' | 'end' | 'center';

export class ArrowMarkupInteractionHandler extends MarkupInteractionHandler {
  private pointerId?: number;
  private anchor: ViewerMarkupArrowEditAnchor = 'end';

  public constructor(
    private readonly markupEl: HTMLVertexViewerMarkupArrowElement,
    private readonly editBegin: EventEmitter<void>,
    private readonly editEnd: EventEmitter<void>
  ) {
    super();
  }

  public editAnchor(
    anchor: ViewerMarkupArrowEditAnchor,
    event: PointerEvent
  ): void {
    this.anchor = anchor;
    this.startInteraction(event);
  }

  public startInteraction(event: PointerEvent): void {
    this.handleInteractionAttempt(event);
  }

  protected computeBoundingRect(): DOMRect {
    return getMarkupBoundingClientRect(this.markupEl);
  }

  protected handleInteractionAttempt(event: PointerEvent): void {
    if (
      this.markupEl.mode !== '' &&
      this.pointerId == null &&
      this.elementBounds != null
    ) {
      this.pointerId = event.pointerId;
      this.markupEl.start =
        this.markupEl.start ??
        translatePointToRelative(
          getMouseClientPosition(event, this.elementBounds),
          this.elementBounds
        );

      this.editBegin.emit();
      this.acceptInteraction();
    }
  }

  protected handleInteractionMove(event: PointerEvent): void {
    if (this.elementBounds != null && this.pointerId === event.pointerId) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
      if (this.anchor === 'start') {
        this.markupEl.start = position;
      } else if (this.anchor === 'end') {
        this.markupEl.end = position;
      } else if (this.markupEl.start != null && this.markupEl.end != null) {
        const center = Point.create(
          (this.markupEl.start.x + this.markupEl.end.x) / 2,
          (this.markupEl.start.y + this.markupEl.end.y) / 2
        );
        const xDifference = center.x - position.x;
        const yDifference = center.y - position.y;

        this.markupEl.start = Point.create(
          this.markupEl.start.x - xDifference,
          this.markupEl.start.y - yDifference
        );
        this.markupEl.end = Point.create(
          this.markupEl.end.x - xDifference,
          this.markupEl.end.y - yDifference
        );
      }
    }
  }

  protected handleInteractionEnd(event: PointerEvent): void {
    if (this.pointerId === event.pointerId) {
      const screenStart =
        this.markupEl.start != null && this.elementBounds != null
          ? translatePointToScreen(this.markupEl.start, this.elementBounds)
          : undefined;
      const screenEnd =
        this.markupEl.end != null && this.elementBounds != null
          ? translatePointToScreen(this.markupEl.end, this.elementBounds)
          : undefined;

      if (
        this.markupEl.mode !== '' &&
        screenStart != null &&
        screenEnd != null &&
        Point.distance(screenStart, screenEnd) >= 2
      ) {
        this.editEnd.emit();
      } else {
        this.markupEl.start = undefined;
        this.markupEl.end = undefined;
      }

      this.pointerId = undefined;
    }
  }
}
