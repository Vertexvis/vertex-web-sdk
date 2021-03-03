import { InteractionHandler } from './interactionHandler';
import { InteractionApi } from './interactionApi';
import { Point, Matrix2, Angle } from '@vertexvis/geometry';

export abstract class MultiTouchInteractionHandler
  implements InteractionHandler {
  protected element?: HTMLElement;
  protected interactionApi?: InteractionApi;
  protected currentPosition1?: Point.Point;
  protected currentPosition2?: Point.Point;
  protected startingPosition1?: Point.Point;
  protected startingPosition2?: Point.Point;

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
      this.interactionApi?.beginInteraction();
      this.interactionApi?.zoomCamera(zoom);
      this.interactionApi?.panCamera(delta);

      if (this.startingPosition1 != null && this.startingPosition2 != null) {
        const startingToPrevious = Matrix2.create(
          Point.subtract(this.startingPosition1, this.startingPosition2),
          Point.subtract(this.currentPosition1, this.currentPosition2)
        );
        const startingToCurrent = Matrix2.create(
          Point.subtract(this.startingPosition1, this.startingPosition2),
          Point.subtract(point1, point2)
        );
        const previousAngle = Angle.toDegrees(
          Math.atan2(
            Matrix2.determinant(startingToPrevious),
            Matrix2.dot(startingToPrevious)
          )
        );
        const currentAngle = Angle.toDegrees(
          Math.atan2(
            Matrix2.determinant(startingToCurrent),
            Matrix2.dot(startingToCurrent)
          )
        );

        // Previous - Current to invert the value of the angle
        this.interactionApi?.twistCamera2(previousAngle - currentAngle);
      }
    }

    this.currentPosition1 = point1;
    this.currentPosition2 = point2;
  }
}
