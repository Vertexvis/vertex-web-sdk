import {
  Euler,
  Matrix4,
  Plane,
  Point,
  Quaternion,
  Ray,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';

import {
  AngleUnits,
  AngleUnitType,
  DistanceUnits,
  DistanceUnitType,
  Frame,
  Viewport,
} from '../../lib/types';

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

export function computeInputTransform(
  identifier: string,
  value: number,
  lastValue: number,
  distanceUnit: DistanceUnitType = 'millimeters',
  angleUnit: AngleUnitType = 'degrees'
): Matrix4.Matrix4 {
  const units = new DistanceUnits(distanceUnit);
  const angles = new AngleUnits(angleUnit);

  const rotation = (): number =>
    angleUnit === 'degrees'
      ? angles.convertTo(value - lastValue)
      : value - lastValue;
  const position = (): number =>
    units.convertRealValueToWorld(value - lastValue);

  switch (identifier) {
    case 'x-translate':
      return Matrix4.makeTranslation(Vector3.create(position(), 0, 0));
    case 'y-translate':
      return Matrix4.makeTranslation(Vector3.create(0, position(), 0));
    case 'z-translate':
      return Matrix4.makeTranslation(Vector3.create(0, 0, position()));
    case 'x-rotate':
      return Matrix4.makeRotation(
        Quaternion.fromAxisAngle(Vector3.left(), rotation())
      );
    case 'y-rotate':
      return Matrix4.makeRotation(
        Quaternion.fromAxisAngle(Vector3.down(), rotation())
      );
    case 'z-rotate':
      return Matrix4.makeRotation(
        Quaternion.fromAxisAngle(Vector3.forward(), rotation())
      );
  }
  return Matrix4.makeIdentity();
}

export function computeInputDisplayValue(
  identifier: string,
  current: Matrix4.Matrix4,
  start: Matrix4.Matrix4,
  distanceUnit: DistanceUnitType = 'millimeters',
  angleUnit: AngleUnitType = 'degrees'
): number {
  const units = new DistanceUnits(distanceUnit);
  const angles = new AngleUnits(angleUnit);

  const rotation = (): Matrix4.Matrix4 =>
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(current));
  const transformDiff = (): Matrix4.Matrix4 =>
    Matrix4.multiply(current, Matrix4.invert(start));
  const relativeTranslationDiff = (): Vector3.Vector3 =>
    Vector3.transformMatrix(
      Vector3.fromMatrixPosition(transformDiff()),
      Matrix4.invert(rotation())
    );
  const relativeRotationDiff = (): Euler.Euler =>
    Euler.create(
      Vector3.transformMatrix(
        Euler.fromRotationMatrix(Matrix4.invert(transformDiff())),
        Matrix4.invert(rotation())
      )
    );

  const convertAngle = (angle: number): number =>
    angleUnit === 'radians' ? angle : angles.convertTo(angle);

  switch (identifier) {
    case 'x-translate':
      return units.convertWorldValueToReal(relativeTranslationDiff().x);
    case 'y-translate':
      return units.convertWorldValueToReal(relativeTranslationDiff().y);
    case 'z-translate':
      return units.convertWorldValueToReal(relativeTranslationDiff().z);
    case 'x-rotate':
      return convertAngle(relativeRotationDiff().x);
    case 'y-rotate':
      return convertAngle(relativeRotationDiff().y);
    case 'z-rotate':
      return convertAngle(relativeRotationDiff().z);
  }
  return 0;
}

export function computeUpdatedTransform(
  current: Matrix4.Matrix4,
  previous: Vector3.Vector3,
  next: Vector3.Vector3,
  viewVector: Vector3.Vector3,
  angle: number,
  identifier: string
): Matrix4.Matrix4 {
  const delta = Vector3.subtract(next, previous);

  switch (identifier) {
    case 'x-translate': {
      return Matrix4.multiply(
        current,
        computeTranslation(current, Vector3.right(), delta)
      );
    }
    case 'y-translate':
      return Matrix4.multiply(
        current,
        computeTranslation(current, Vector3.up(), delta)
      );
    case 'z-translate':
      return Matrix4.multiply(
        current,
        computeTranslation(current, Vector3.back(), delta)
      );
    case 'x-rotate':
      return Matrix4.multiply(
        computeRotation(
          current,
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(
              computeRotationAxis(current, viewVector, Vector3.right()),
              angle
            )
          )
        ),
        current
      );
    case 'y-rotate':
      return Matrix4.multiply(
        computeRotation(
          current,
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(
              computeRotationAxis(current, viewVector, Vector3.up()),
              angle
            )
          )
        ),
        current
      );
    case 'z-rotate':
      return Matrix4.multiply(
        computeRotation(
          current,
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(
              computeRotationAxis(current, viewVector, Vector3.forward()),
              angle
            )
          )
        ),
        current
      );
    default:
      return current;
  }
}

export function computeRotationAxis(
  current: Matrix4.Matrix4,
  viewVector: Vector3.Vector3,
  axis: Vector3.Vector3
): Vector3.Vector3 {
  const rotation = Matrix4.makeRotation(Quaternion.fromMatrixRotation(current));
  const rotatedAxis = Vector3.transformMatrix(axis, rotation);
  const rotatedNegatedAxis = Vector3.transformMatrix(
    Vector3.negate(axis),
    rotation
  );

  return Vector3.dot(viewVector, rotatedAxis) >
    Vector3.dot(viewVector, rotatedNegatedAxis)
    ? rotatedAxis
    : rotatedNegatedAxis;
}

export function computeTranslation(
  current: Matrix4.Matrix4,
  axis: Vector3.Vector3,
  delta: Vector3.Vector3
): Matrix4.Matrix4 {
  const rotation = Matrix4.makeRotation(Quaternion.fromMatrixRotation(current));
  const rotatedAxis = Vector3.transformMatrix(axis, rotation);
  const rotatedDelta = Vector3.multiply(rotatedAxis, delta);

  return Matrix4.makeTranslation(
    Vector3.scale(rotatedDelta.x + rotatedDelta.y + rotatedDelta.z, axis)
  );
}

/**
 * Computes a rotation Matrix4 by applying the rotation at the given position,
 * then translating it back to convert it to a world delta.
 * @param rotation
 * @param current
 * @returns
 */
export function computeRotation(
  current: Matrix4.Matrix4,
  delta: Matrix4.Matrix4
): Matrix4.Matrix4 {
  return Matrix4.multiply(
    Matrix4.multiply(
      Matrix4.makeTranslation(Vector3.fromMatrixPosition(current)),
      delta
    ),
    Matrix4.makeTranslation(Vector3.negate(Vector3.fromMatrixPosition(current)))
  );
}

export function computeInputPosition(
  viewport: Viewport,
  bounds: Rectangle.Rectangle,
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
}
