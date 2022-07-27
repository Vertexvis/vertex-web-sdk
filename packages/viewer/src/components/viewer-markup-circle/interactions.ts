import type { EventEmitter } from '@stencil/core';
import { Point, Rectangle } from '@vertexvis/geometry';

import { getMouseClientPosition } from '../../lib/dom';
import { MarkupInteractionHandler } from '../../lib/markup/interactions';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  BoundingBox2dAnchorPosition,
  transformRectangle,
  translatePointToRelative,
} from '../viewer-markup/markup-utils';

export class CircleMarkupInteractionHandler extends MarkupInteractionHandler {
  private pointerId?: number;
  private startPosition?: Point.Point;
  private resizeBounds?: Rectangle.Rectangle;

  private anchor: BoundingBox2dAnchorPosition = 'bottom-right';

  public constructor(
    private readonly markupEl: HTMLVertexViewerMarkupCircleElement,
    private readonly editBegin: EventEmitter<void>,
    private readonly editEnd: EventEmitter<void>
  ) {
    super();
  }

  public editAnchor(
    anchor: BoundingBox2dAnchorPosition,
    event: PointerEvent
  ): void {
    if (this.markupEl.mode === 'edit') {
      this.anchor = anchor;
      this.resizeBounds = this.markupEl.bounds;
      this.startInteraction(event);
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
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
      this.pointerId = event.pointerId;
      this.startPosition = position;
      this.markupEl.bounds =
        this.markupEl.bounds ?? Rectangle.create(position.x, position.y, 0, 0);
      this.resizeBounds = this.markupEl.bounds;

      this.editBegin.emit();
      this.acceptInteraction();
    }
  }

  protected handleInteractionMove(event: PointerEvent): void {
    if (
      this.markupEl.bounds != null &&
      this.startPosition != null &&
      this.elementBounds != null &&
      this.pointerId === event.pointerId
    ) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );

      this.markupEl.bounds = transformRectangle(
        this.resizeBounds ?? this.markupEl.bounds,
        this.startPosition,
        position,
        this.anchor,
        event.shiftKey
      );
    }
  }

  protected handleInteractionEnd(event: PointerEvent): void {
    if (this.pointerId === event.pointerId) {
      if (
        this.markupEl.mode !== '' &&
        this.markupEl.bounds != null &&
        this.markupEl.bounds?.width > 0 &&
        this.markupEl.bounds?.height > 0
      ) {
        this.anchor = 'bottom-right';
        this.editEnd.emit();
      } else {
        this.markupEl.bounds = undefined;
      }

      this.pointerId = undefined;
    }
  }
}
