import { InteractionHandler } from './interactionHandler';
import { InteractionApi } from './interactionApi';
import { Point, Matrix2, Angle } from '@vertexvis/geometry';

export abstract class MultiTouchInteractionHandler
  implements InteractionHandler {
  protected element?: HTMLElement;
  protected interactionApi?: InteractionApi;
  protected currentPosition1?: Point.Point;
  protected currentPosition2?: Point.Point;

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;
  }

  public dispose(): void {
    this.element = undefined;
  }

  protected handleTwoPointTouchMove(
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
      const previousToCurrent = Matrix2.create(
        Point.subtract(this.currentPosition1, this.currentPosition2),
        Point.subtract(point1, point2)
      );
      const angle = Angle.toDegrees(
        Math.atan2(
          Matrix2.determinant(previousToCurrent),
          Matrix2.dot(previousToCurrent)
        )
      );
      this.interactionApi?.beginInteraction();
      this.interactionApi?.zoomCamera(zoom);
      this.interactionApi?.panCamera(delta);

      this.interactionApi?.twistCamera(angle);
    }

    this.currentPosition1 = point1;
    this.currentPosition2 = point2;
  }
}
