import { Angle, Matrix2, Point } from '@vertexvis/geometry';

import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';

export abstract class MultiTouchInteractionHandler
  implements InteractionHandler
{
  protected element?: HTMLElement;
  protected interactionApi?: InteractionApi;

  private previousFirstPoints: Point.Point[] = [];
  private previousSecondPoints: Point.Point[] = [];

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
    this.previousFirstPoints = [...this.previousFirstPoints, point1];
    this.previousSecondPoints = [...this.previousSecondPoints, point2];

    // Process updates to touch points on animation frame callbacks to batch
    // the processing. Because each event can potentially only represent a single
    // touch point moving, two opposing angles can be computed sequentially. This
    // results in a wobbling effect if those angles are both sent, and this batched
    // processing helps to reduce that effect.
    window.requestAnimationFrame(() => {
      if (
        this.previousFirstPoints.length > 1 &&
        this.previousSecondPoints.length > 1 &&
        this.previousFirstPoints.length === this.previousSecondPoints.length
      ) {
        const previousFirstPoints = this.previousFirstPoints;
        const previousSecondPoints = this.previousSecondPoints;

        this.previousFirstPoints = this.previousFirstPoints.slice(-1);
        this.previousSecondPoints = this.previousSecondPoints.slice(-1);

        const changes = previousFirstPoints.reduce<{
          deltas: Point.Point[];
          zooms: number[];
          angles: number[];
        }>(
          (result, previousFirstPoint, i) => {
            if (i < previousFirstPoints.length - 1) {
              const firstPoint = previousFirstPoints[i + 1];
              const previousSecondPoint = previousSecondPoints[i];
              const secondPoint = previousSecondPoints[i + 1];

              return {
                deltas: [
                  ...result.deltas,
                  this.computeDelta(
                    previousFirstPoint,
                    previousSecondPoint,
                    firstPoint,
                    secondPoint
                  ),
                ],
                zooms: [
                  ...result.zooms,
                  this.computeZoom(
                    previousFirstPoint,
                    previousSecondPoint,
                    firstPoint,
                    secondPoint
                  ),
                ],
                angles: [
                  ...result.angles,
                  this.computeAngle(
                    previousFirstPoint,
                    previousSecondPoint,
                    firstPoint,
                    secondPoint
                  ),
                ],
              };
            }
            return result;
          },
          {
            deltas: [],
            zooms: [],
            angles: [],
          }
        );

        const delta = changes.deltas.reduce(
          (r, d) => Point.add(r, d),
          Point.create()
        );
        const zoom = changes.zooms.reduce((z, d) => z + d, 0);
        const angle = changes.angles.reduce((a, d) => a + d, 0);

        const center = Point.create(
          (previousFirstPoints[previousFirstPoints.length - 1].x +
            previousSecondPoints[previousSecondPoints.length - 1].x) /
            2,
          (previousFirstPoints[previousFirstPoints.length - 1].y +
            previousSecondPoints[previousSecondPoints.length - 1].y) /
            2
        );

        this.interactionApi?.beginInteraction();
        this.interactionApi?.zoomCameraToPoint(center, zoom);
        this.interactionApi?.panCameraByDelta(delta);
        this.interactionApi?.twistCamera(angle);
      }
    });
  }

  protected endTwoPointTouch(): void {
    this.previousFirstPoints = [];
    this.previousSecondPoints = [];
  }

  private computeDelta(
    previousPoint1: Point.Point,
    previousPoint2: Point.Point,
    point1: Point.Point,
    point2: Point.Point
  ): Point.Point {
    return Point.add(
      Point.subtract(point1, previousPoint1),
      Point.subtract(point2, previousPoint2)
    );
  }

  private computeZoom(
    previousPoint1: Point.Point,
    previousPoint2: Point.Point,
    point1: Point.Point,
    point2: Point.Point
  ): number {
    const distance =
      Point.distance(point1, point2) -
      Point.distance(previousPoint1, previousPoint2);
    return distance * 0.5;
  }

  private computeAngle(
    previousPoint1: Point.Point,
    previousPoint2: Point.Point,
    point1: Point.Point,
    point2: Point.Point
  ): number {
    const previousToCurrent = Matrix2.create(
      Point.subtract(previousPoint1, previousPoint2),
      Point.subtract(point1, point2)
    );
    return Angle.toDegrees(
      Math.atan2(
        Matrix2.determinant(previousToCurrent),
        Matrix2.dot(previousToCurrent)
      )
    );
  }
}
