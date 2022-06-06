import type { EventEmitter } from '@stencil/core';
import { Point, Rectangle } from '@vertexvis/geometry';

import { getMouseClientPosition } from '../../lib/dom';
import { MarkupInteractionHandler } from '../../lib/markup/interactions';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  BoundingBox2dAnchorPosition,
  transformRectangle,
  translatePointsToBounds,
  translatePointToRelative,
} from '../viewer-markup/utils';

export class FreeformMarkupInteractionHandler extends MarkupInteractionHandler {
  private pointerId?: number;
  private min?: Point.Point;
  private max?: Point.Point;

  private resizeBounds?: Rectangle.Rectangle;
  private resizePoints?: Point.Point[];
  private resizeStartPosition?: Point.Point;

  private anchor: BoundingBox2dAnchorPosition = 'bottom-right';

  public constructor(
    private readonly markupEl: HTMLVertexViewerMarkupFreeformElement,
    private readonly editBegin: EventEmitter<void>,
    private readonly editEnd: EventEmitter<void>
  ) {
    super();
  }

  public editAnchor(
    anchor: BoundingBox2dAnchorPosition,
    event: PointerEvent
  ): void {
    if (this.markupEl.mode === 'edit' && this.elementBounds != null) {
      this.resizeBounds = this.markupEl.bounds;
      this.resizePoints = this.markupEl.points;
      this.anchor = anchor;
      this.resizeStartPosition = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );

      window.addEventListener('pointermove', this.handleResizeInteractionMove);
      window.addEventListener('pointerup', this.handleResizeInteractionEnd);
    }
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
      const screenPosition = getMouseClientPosition(event, this.elementBounds);
      const position = translatePointToRelative(
        screenPosition,
        this.elementBounds
      );
      this.updateMinAndMax(position);
      this.markupEl.points = this.markupEl.points ?? [position];

      this.editBegin.emit();
      this.acceptInteraction();
    }
  }

  protected handleInteractionMove(event: PointerEvent): void {
    if (
      this.pointerId === event.pointerId &&
      this.markupEl.points != null &&
      this.elementBounds != null
    ) {
      const screenPosition = getMouseClientPosition(event, this.elementBounds);
      const position = translatePointToRelative(
        screenPosition,
        this.elementBounds
      );
      this.updateMinAndMax(position);
      this.markupEl.points = [...this.markupEl.points, position];
    }
  }

  protected handleInteractionEnd(event: PointerEvent): void {
    if (this.pointerId === event.pointerId) {
      if (
        this.markupEl.mode !== '' &&
        this.markupEl.points != null &&
        this.markupEl.points.length > 2 &&
        this.elementBounds != null
      ) {
        const screenPosition = getMouseClientPosition(
          event,
          this.elementBounds
        );
        const position = translatePointToRelative(
          screenPosition,
          this.elementBounds
        );

        this.updateMinAndMax(position);

        this.markupEl.points = [...this.markupEl.points, position];
        this.editEnd.emit();
      } else {
        this.markupEl.points = undefined;
      }

      this.min = undefined;
      this.max = undefined;
      this.pointerId = undefined;
    }
  }

  private handleResizeInteractionMove = (event: PointerEvent): void => {
    if (
      this.resizeStartPosition != null &&
      this.elementBounds != null &&
      this.resizeBounds != null &&
      this.resizePoints != null
    ) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );

      const updatedBounds = transformRectangle(
        this.resizeBounds,
        this.resizeStartPosition,
        position,
        this.anchor,
        event.shiftKey
      );

      this.markupEl.points = translatePointsToBounds(
        this.resizePoints,
        this.resizeBounds,
        updatedBounds
      );
      this.markupEl.bounds = updatedBounds;
    }
  };

  private handleResizeInteractionEnd = (event: PointerEvent): void => {
    window.removeEventListener('pointermove', this.handleResizeInteractionMove);
    window.removeEventListener('pointerup', this.handleResizeInteractionEnd);

    this.resizeBounds = undefined;
    this.editEnd.emit();
  };

  private updateMinAndMax(position: Point.Point): void {
    this.min =
      this.min != null
        ? Point.create(
            Math.min(this.min.x, position.x),
            Math.min(this.min.y, position.y)
          )
        : position;
    this.max =
      this.max != null
        ? Point.create(
            Math.max(this.max.x, position.x),
            Math.max(this.max.y, position.y)
          )
        : position;
    this.markupEl.bounds = Rectangle.create(
      this.min.x,
      this.min.y,
      this.max.x - this.min.x,
      this.max.y - this.min.y
    );
  }
}
