import { Point, Rectangle } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

export class ViewerDragSelectModel {
  private dragStartPoint?: Point.Point;
  private dragEndPoint?: Point.Point;

  private dragFinished = new EventDispatcher<Rectangle.Rectangle>();

  private boundsChanged = new EventDispatcher<
    Rectangle.Rectangle | undefined
  >();

  public getDragBounds(): Rectangle.Rectangle {
    if (this.dragStartPoint != null && this.dragEndPoint != null) {
      return Rectangle.fromPoints(this.dragStartPoint, this.dragEndPoint);
    }
    return Rectangle.create(0, 0, 0, 0);
  }

  public updateStartPoint(point: Point.Point): void {
    this.dragStartPoint = point;
  }

  public updateEndPoint(point: Point.Point): void {
    this.dragEndPoint = point;

    this.boundsChanged.emit(this.getDragBounds());
  }

  public clear(): void {
    this.dragFinished.emit(this.getDragBounds());

    this.dragStartPoint = undefined;
    this.dragEndPoint = undefined;

    this.boundsChanged.emit(undefined);
  }

  public onDragFinished(listener: Listener<Rectangle.Rectangle>): Disposable {
    return this.dragFinished.on(listener);
  }

  public onBoundsChanged(
    listener: Listener<Rectangle.Rectangle | undefined>
  ): Disposable {
    return this.boundsChanged.on(listener);
  }
}
