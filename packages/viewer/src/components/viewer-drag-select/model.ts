import { Point, Rectangle } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

export type ViewerDragSelectDirection = 'left' | 'right';

export interface BoundsChangedEvent {
  rectangle?: Rectangle.Rectangle;
  direction?: ViewerDragSelectDirection;
}

export interface DragFinishedEvent {
  rectangle: Rectangle.Rectangle;
  direction: ViewerDragSelectDirection;
}

export class ViewerDragSelectModel {
  private dragStartPoint?: Point.Point;
  private dragEndPoint?: Point.Point;
  private direction?: ViewerDragSelectDirection;

  private dragFinished = new EventDispatcher<DragFinishedEvent>();

  private boundsChanged = new EventDispatcher<BoundsChangedEvent>();

  public updateStartPoint(point: Point.Point): void {
    this.dragStartPoint = point;
  }

  public updateEndPoint(point: Point.Point): void {
    this.dragEndPoint = point;

    this.direction =
      Point.subtract(point, this.dragStartPoint ?? point).x > 0
        ? 'right'
        : 'left';

    this.boundsChanged.emit({
      rectangle: this.getDragBounds(),
      direction: this.getDragDirection(),
    });
  }

  public clear(): void {
    this.dragFinished.emit({
      rectangle: this.getDragBounds(),
      direction: this.getDragDirection(),
    });

    this.dragStartPoint = undefined;
    this.dragEndPoint = undefined;

    this.boundsChanged.emit({});
  }

  public onDragFinished(listener: Listener<DragFinishedEvent>): Disposable {
    return this.dragFinished.on(listener);
  }

  public onBoundsChanged(listener: Listener<BoundsChangedEvent>): Disposable {
    return this.boundsChanged.on(listener);
  }

  private getDragBounds(): Rectangle.Rectangle {
    if (this.dragStartPoint != null && this.dragEndPoint != null) {
      return Rectangle.fromPoints(this.dragStartPoint, this.dragEndPoint);
    }
    return Rectangle.create(0, 0, 0, 0);
  }

  private getDragDirection(): ViewerDragSelectDirection {
    return this.direction ?? 'right';
  }
}
