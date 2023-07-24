import { Angle, Matrix2, Point } from '@vertexvis/geometry';

import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';

export abstract class MultiTouchInteractionHandler
  implements InteractionHandler
{
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
      // const delta = Point.scale(
      //   Point.add(
      //     Point.subtract(point1, this.currentPosition1),
      //     Point.subtract(point2, this.currentPosition2)
      //   ),
      //   0.25,
      //   0.25
      // );

      const center1 = Point.create(
        (this.currentPosition1.x + this.currentPosition2.x) / 2,
        (this.currentPosition1.y + this.currentPosition2.y) / 2
      );

      const center2 = Point.create(
        (point1.x + point2.x) / 2,
        (point1.y + point2.y) / 2
      );
      const panDelta = Point.scale(
        Point.subtract(point1, this.currentPosition1),
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
      const center = Point.create(
        (this.currentPosition1.x + this.currentPosition2.x) / 2,
        (this.currentPosition1.y + this.currentPosition2.y) / 2
      );

      this.interactionApi?.beginInteraction();
      this.interactionApi?.zoomCameraToPoint(center, zoom);

      this.interactionApi?.panCameraByDelta(panDelta);

      // // Setting a minimum angle to prevent wobbling
      if (Math.abs(angle) > 0.5) {
        document.getElementById('my-delta-2')!.textContent =
          JSON.stringify(angle);

        this.interactionApi?.twistCamera(angle);
      }
    }

    this.currentPosition1 = point1;
    this.currentPosition2 = point2;
  }
}
