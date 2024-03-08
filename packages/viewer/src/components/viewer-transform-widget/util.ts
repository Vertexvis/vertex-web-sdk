import {
  Matrix4,
  Plane,
  Point,
  Quaternion,
  Ray,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';

import { Frame, Viewport } from '../../lib/types';

export interface PointAndPosition {
  point: Point.Point;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function convertPointToCanvas(
  point: Point.Point,
  bounds?: DOMRect
): Point.Point | undefined {
  return bounds != null
    ? Point.create(point.x - bounds.left, point.y - bounds.top)
    : undefined;
}

export function convertCanvasPointToWorld(
  point?: Point.Point,
  frame?: Frame,
  viewport?: Viewport,
  transform?: Matrix4.Matrix4
): Vector3.Vector3 | undefined {
  const position =
    transform != null ? Vector3.fromMatrixPosition(transform) : undefined;

  if (point != null && frame != null && viewport != null && position != null) {
    if (frame.scene.camera.isOrthographic()) {
      const ray = viewport.transformPointToOrthographicRay(
        point,
        frame.image,
        frame.scene.camera
      );
      // Offset the point to past the bounding sphere of the model to
      // adjust the position plane location.
      const offsetPoint = Ray.at(
        Ray.create({
          origin: position,
          direction: frame.scene.camera.direction,
        }),
        Vector3.magnitude(frame.scene.camera.viewVector) * 2
      );

      return Ray.intersectPlane(
        ray,
        Plane.fromNormalAndCoplanarPoint(
          frame.scene.camera.direction,
          offsetPoint
        )
      );
    } else {
      const ray = viewport.transformPointToRay(
        point,
        frame.image,
        frame.scene.camera
      );

      return Ray.intersectPlane(
        ray,
        Plane.fromNormalAndCoplanarPoint(frame.scene.camera.direction, position)
      );
    }
  }
  return undefined;
}

export function computeUpdatedTransform(
  current: Matrix4.Matrix4,
  previous: Vector3.Vector3,
  next: Vector3.Vector3,
  viewVector: Vector3.Vector3,
  angle: number,
  identifier: string
): Matrix4.Matrix4 {
  switch (identifier) {
    case 'x-translate': {
      return Matrix4.multiply(
        current,
        Matrix4.makeTranslation(
          Vector3.create(
            computeTranslation(current, previous, next, Vector3.right()),
            0,
            0
          )
        )
      );
    }
    case 'y-translate':
      return Matrix4.multiply(
        current,
        Matrix4.makeTranslation(
          Vector3.create(
            0,
            computeTranslation(current, previous, next, Vector3.up()),
            0
          )
        )
      );
    case 'z-translate':
      return Matrix4.multiply(
        current,
        Matrix4.makeTranslation(
          Vector3.create(
            0,
            0,
            computeTranslation(current, previous, next, Vector3.back())
          )
        )
      );
    case 'x-rotate': {
      const rotation = Quaternion.fromMatrixRotation(current);
      const rotatedRight = Vector3.transformMatrix(
        Vector3.right(),
        Matrix4.makeRotation(rotation)
      );
      const rotatedLeft = Vector3.transformMatrix(
        Vector3.left(),
        Matrix4.makeRotation(rotation)
      );

      const rotationAxis =
        Vector3.dot(viewVector, rotatedRight) >
        Vector3.dot(viewVector, rotatedLeft)
          ? rotatedRight
          : rotatedLeft;

      return computeRotation(
        Quaternion.fromAxisAngle(rotationAxis, angle),
        current
      );
    }
    case 'y-rotate': {
      const rotation = Quaternion.fromMatrixRotation(current);
      const rotatedUp = Vector3.transformMatrix(
        Vector3.up(),
        Matrix4.makeRotation(rotation)
      );
      const rotatedDown = Vector3.transformMatrix(
        Vector3.down(),
        Matrix4.makeRotation(rotation)
      );

      const rotationAxis =
        Vector3.dot(viewVector, rotatedUp) >
        Vector3.dot(viewVector, rotatedDown)
          ? rotatedUp
          : rotatedDown;

      return computeRotation(
        Quaternion.fromAxisAngle(rotationAxis, angle),
        current
      );
    }
    case 'z-rotate': {
      const rotation = Quaternion.fromMatrixRotation(current);
      const rotatedForward = Vector3.transformMatrix(
        Vector3.forward(),
        Matrix4.makeRotation(rotation)
      );
      const rotatedBack = Vector3.transformMatrix(
        Vector3.back(),
        Matrix4.makeRotation(rotation)
      );

      const rotationAxis =
        Vector3.dot(viewVector, rotatedForward) >
        Vector3.dot(viewVector, rotatedBack)
          ? rotatedForward
          : rotatedBack;

      return computeRotation(
        Quaternion.fromAxisAngle(rotationAxis, angle),
        current
      );
    }
    default:
      return current;
  }
}

export function computeRotationAxis(
  current: Matrix4.Matrix4,
  viewVector: Vector3.Vector3,
  a: Vector3.Vector3,
  b: Vector3.Vector3
): Vector3.Vector3 {
  const rotation = Quaternion.fromMatrixRotation(current);
  const rotatedA = Vector3.transformMatrix(a, Matrix4.makeRotation(rotation));
  const rotatedB = Vector3.transformMatrix(b, Matrix4.makeRotation(rotation));

  return Vector3.dot(viewVector, rotatedA) > Vector3.dot(viewVector, rotatedB)
    ? rotatedA
    : rotatedB;
}

function computeTranslation(
  current: Matrix4.Matrix4,
  previous: Vector3.Vector3,
  next: Vector3.Vector3,
  direction: Vector3.Vector3
): number {
  const rotatedTranslationAxis = Vector3.transformMatrix(
    direction,
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(current))
  );
  const rotatedDelta = Vector3.multiply(
    rotatedTranslationAxis,
    Vector3.subtract(next, previous)
  );

  return rotatedDelta.x + rotatedDelta.y + rotatedDelta.z;
}

/**
 * Computes a rotation Matrix4 by applying the rotation at the given position,
 * then translating it back to convert it to a world delta.
 * @param rotation
 * @param current
 * @returns
 */
export function computeRotation(
  rotation: Quaternion.Quaternion,
  current: Matrix4.Matrix4
): Matrix4.Matrix4 {
  return Matrix4.multiply(
    Matrix4.multiply(
      Matrix4.multiply(
        Matrix4.makeTranslation(Vector3.fromMatrixPosition(current)),
        Matrix4.makeRotation(rotation)
      ),
      Matrix4.makeTranslation(
        Vector3.negate(Vector3.fromMatrixPosition(current))
      )
    ),
    current
  );
}

export function computeInputPosition(
  frame: Frame,
  viewport: Viewport,
  // boundingBox: BoundingBox.BoundingBox,
  bounds: Rectangle.Rectangle,
  origin: Vector3.Vector3,
  shapePoints: Point.Point[]
): PointAndPosition {
  const paddedBounds = Rectangle.pad(bounds, 5);
  const canvasPoints = shapePoints.map((sp) =>
    viewport.transformNdcPointToViewport(sp)
  );

  const topLeft = Rectangle.topLeft(paddedBounds);
  const topRight = Point.add(topLeft, Point.create(paddedBounds.width, 0));
  const bottomRight = Rectangle.bottomRight(paddedBounds);
  const bottomLeft = Point.subtract(
    bottomRight,
    Point.create(paddedBounds.width, 0)
  );

  const center = Point.scale(
    canvasPoints.reduce((sum, pt) => Point.add(sum, pt), Point.create()),
    1 / canvasPoints.length,
    1 / canvasPoints.length
  );

  const closestPoint = [topRight, bottomLeft, bottomRight].reduce(
    (closest, pt) =>
      Point.distance(center, pt) < Point.distance(center, closest)
        ? pt
        : closest,
    topLeft
  );

  switch (closestPoint) {
    case topLeft:
      return { point: closestPoint, position: 'top-left' };
    case topRight:
      return { point: closestPoint, position: 'top-right' };
    case bottomLeft:
      return { point: closestPoint, position: 'bottom-left' };
    default:
      return { point: closestPoint, position: 'bottom-right' };
  }

  // const furthestPoint = shapePoints.reduce(
  //   (fp, p) =>
  //     Vector3.distance(origin, p) > Vector3.distance(origin, fp) ? p : fp,
  //   origin
  // );
  // const ray = Ray.create({
  //   origin: furthestPoint,
  //   direction: Vector3.normalize(Vector3.subtract(furthestPoint, origin)),
  // });
  // const furthestCanvasPoint = viewport.transformWorldToViewport(
  //   furthestPoint,
  //   frame.scene.camera.projectionViewMatrix
  // );

  // const closestBoundingBoxPoint = boundingBox.

  // const boundsTopLeft = Rectangle.topLeft(bounds);
  // const boundsBottomRight = Rectangle.bottomRight(bounds);

  // const closestPoint =
  //   Point.distance(furthestCanvasPoint, boundsTopLeft) >
  //   Point.distance(furthestCanvasPoint, boundsBottomRight)
  //     ? boundsTopLeft
  //     : boundsBottomRight;

  // const closestPointRay = frame.scene.camera.isPerspective()
  //   ? viewport.transformPointToRay(
  //       closestPoint,
  //       frame.image,
  //       frame.scene.camera
  //     )
  //   : viewport.transformPointToOrthographicRay(
  //       closestPoint,
  //       frame.image,
  //       frame.scene.camera
  //     );

  // const positionPlane = Plane.create({
  //   normal: Vector3.normalize(
  //     Vector3.subtract(frame.scene.camera.position, origin)
  //   ),
  // });

  // const worldIntersection = Ray.intersectPlane(closestPointRay, positionPlane);

  // return Ray.at(ray, 100);
}
