import { Point, Rectangle } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { VolumeIntersectionQueryMode } from '../../components/viewer-box-query-tool/viewer-box-query-tool';

export type QueryType = 'inclusive' | 'exclusive';

export interface VolumeIntersectionQueryDetails {
  screenBounds: Rectangle.Rectangle;
  type: QueryType;
}

export class VolumeIntersectionQueryModel {
  private startPoint?: Point.Point;
  private endPoint?: Point.Point;
  private type?: QueryType;

  private dragStarted = new EventDispatcher<void>();
  private dragComplete = new EventDispatcher<VolumeIntersectionQueryDetails>();

  private screenBoundsChanged = new EventDispatcher<
    VolumeIntersectionQueryDetails | undefined
  >();

  public constructor(private mode?: VolumeIntersectionQueryMode) {}

  public setStartPoint(point: Point.Point): void {
    this.startPoint = point;

    this.dragStarted.emit();
  }

  public setEndPoint(point: Point.Point): void {
    this.endPoint = point;

    this.updateQueryType();
    this.screenBoundsChanged.emit(this.getQueryDetails());
  }

  public setMode(mode?: VolumeIntersectionQueryMode): void {
    this.mode = mode;
  }

  public complete(): void {
    if (this.startPoint != null && this.endPoint != null) {
      this.screenBoundsChanged.emit(undefined);
      this.dragComplete.emit(this.getQueryDetails());
      this.reset();
    }
  }

  public reset(): void {
    this.startPoint = undefined;
    this.endPoint = undefined;
    this.type = undefined;
  }

  public getScreenBounds(): Rectangle.Rectangle | undefined {
    return this.startPoint != null && this.endPoint != null
      ? Rectangle.fromPoints(this.startPoint, this.endPoint)
      : undefined;
  }

  public getType(): QueryType | undefined {
    return this.type;
  }

  public onScreenBoundsChanged(
    listener: Listener<VolumeIntersectionQueryDetails | undefined>
  ): Disposable {
    return this.screenBoundsChanged.on(listener);
  }

  public onDragStarted(listener: Listener<void>): Disposable {
    return this.dragStarted.on(listener);
  }

  public onDragComplete(
    listener: Listener<VolumeIntersectionQueryDetails>
  ): Disposable {
    return this.dragComplete.on(listener);
  }

  private getQueryDetails(): VolumeIntersectionQueryDetails {
    if (this.startPoint != null && this.endPoint != null && this.type != null) {
      return {
        screenBounds: Rectangle.fromPoints(this.startPoint, this.endPoint),
        type: this.type,
      };
    } else {
      throw new Error(
        'Failed to create query details, the start and end points must be set.'
      );
    }
  }

  private updateQueryType(): void {
    if (this.startPoint != null && this.endPoint != null) {
      const directionalType =
        Point.subtract(this.endPoint, this.startPoint).x > 0
          ? 'exclusive'
          : 'inclusive';

      this.type = this.mode ?? directionalType;
    }
  }
}
