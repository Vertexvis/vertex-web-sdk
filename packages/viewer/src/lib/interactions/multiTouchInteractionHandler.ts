import { Angle, Matrix2, Point } from '@vertexvis/geometry';

import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';

export const SUFFICIENT_ANGLE_HISTORY_SIZE = 5;

export abstract class MultiTouchInteractionHandler
  implements InteractionHandler
{
  protected element?: HTMLElement;
  protected interactionApi?: InteractionApi;
  protected currentPosition1?: Point.Point;
  protected currentPosition2?: Point.Point;

  private previousAngles: number[] = [];

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
      const delta = Point.add(
        Point.subtract(point1, this.currentPosition1),
        Point.subtract(point2, this.currentPosition2)
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
        (point1.x + point2.x) / 2,
        (point1.y + point2.y) / 2
      );

      this.interactionApi?.beginInteraction();
      this.interactionApi?.zoomCameraToPoint(center, zoom);
      this.interactionApi?.panCameraByDelta(delta);

      // Leverage historical angles computed to help prevent wobbling during
      // pan interactions. The singular computed angle can represent a single
      // touch point moving rather than the combined movement, where the first
      // event computes an angle like `0.3` and the second event computes an angle
      // like `-0.3`, which shouldn't actually result in a twist forward and back.
      const angleSum = this.previousAngles.reduce((a, r) => a + r, angle);
      const sufficientData =
        this.previousAngles.length >= SUFFICIENT_ANGLE_HISTORY_SIZE;
      const largeMovement = Math.abs(angleSum) >= 3;
      if (sufficientData || largeMovement) {
        this.interactionApi?.twistCamera(angleSum);
        this.previousAngles = [];
      } else {
        this.previousAngles = [angle, ...this.previousAngles];
      }
    }

    this.currentPosition1 = point1;
    this.currentPosition2 = point2;
  }

  protected endTwoPointTouch(): void {
    this.previousAngles = [];
  }
}
