import {
  Angle,
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
import { ModifierKey } from '../../lib/types/keys';
import { TransformWidgetInputPlacement } from './viewer-transform-widget-components';

export interface PointAndPlacement {
  point: Point.Point;
  placement: TransformWidgetInputPlacement;
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
    const ray = viewport.transformPointToRay(
      point,
      frame.image,
      frame.scene.camera
    );

    if (frame.scene.camera.isOrthographic()) {
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
      return Ray.intersectPlane(
        ray,
        Plane.fromNormalAndCoplanarPoint(frame.scene.camera.direction, position)
      );
    }
  }
  return undefined;
}

export function computeInputDeltaTransform(
  current: Matrix4.Matrix4,
  identifier: string,
  value: number,
  lastValue: number,
  distanceUnit: DistanceUnitType,
  angleUnit: AngleUnitType
): Matrix4.Matrix4 {
  return appliedToCurrent(
    current,
    computeInputGlobalTransform(
      identifier,
      value,
      lastValue,
      distanceUnit,
      angleUnit
    )
  );
}

function computeInputGlobalTransform(
  identifier: string,
  value: number,
  lastValue: number,
  distanceUnit: DistanceUnitType,
  angleUnit: AngleUnitType
): Matrix4.Matrix4 {
  const units = new DistanceUnits(distanceUnit);
  const angles = new AngleUnits(angleUnit);

  const rotation = (): number => angles.convertFrom(value - lastValue);
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
    default:
      return Matrix4.makeIdentity();
  }
}

export function eulerOrderForIdentifier(identifier: string): Euler.EulerOrder {
  switch (identifier) {
    case 'x-rotate':
      return 'xyz';
    case 'y-rotate':
      return 'yzx';
    case 'z-rotate':
      return 'zxy';
    default:
      return 'xyz';
  }
}

export function computeInputDisplayValue(
  identifier: string,
  current: Matrix4.Matrix4,
  start: Matrix4.Matrix4,
  distanceUnit: DistanceUnitType,
  angleUnit: AngleUnitType
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
    Euler.fromRotationMatrix(
      Matrix4.multiply(Matrix4.invert(rotation()), start),
      eulerOrderForIdentifier(identifier)
    );

  switch (identifier) {
    case 'x-translate':
      return units.convertWorldValueToReal(relativeTranslationDiff().x);
    case 'y-translate':
      return units.convertWorldValueToReal(relativeTranslationDiff().y);
    case 'z-translate':
      return units.convertWorldValueToReal(relativeTranslationDiff().z);
    case 'x-rotate':
      return angles.convertTo(Angle.normalizeRadians(relativeRotationDiff().x));
    case 'y-rotate':
      return angles.convertTo(Angle.normalizeRadians(relativeRotationDiff().y));
    case 'z-rotate':
      return angles.convertTo(Angle.normalizeRadians(relativeRotationDiff().z));
    default:
      return 0;
  }
}

export function computeHandleDeltaTransform(
  current: Matrix4.Matrix4,
  previous: Vector3.Vector3,
  next: Vector3.Vector3,
  viewVector: Vector3.Vector3,
  angle: number,
  identifier: string
): Matrix4.Matrix4 {
  return computeHandleGlobalTransform(
    current,
    Vector3.subtract(next, previous),
    viewVector,
    angle,
    identifier
  );
}

function computeHandleGlobalTransform(
  currentTransformationMatrix: Matrix4.Matrix4,
  translationVectorWorld: Vector3.Vector3,
  viewVector: Vector3.Vector3,
  angle: number,
  identifier: string
): Matrix4.Matrix4 {
  switch (identifier) {
    case 'x-translate':
      return performTranslationConstrainedToAxis(
        currentTransformationMatrix,
        translationVectorWorld,
        Vector3.right()
      );
    case 'y-translate':
      return performTranslationConstrainedToAxis(
        currentTransformationMatrix,
        translationVectorWorld,
        Vector3.up()
      );
    case 'z-translate':
      return performTranslationConstrainedToAxis(
        currentTransformationMatrix,
        translationVectorWorld,
        Vector3.back()
      );
    case 'xy-translate':
      return performTranslationConstrainedToPlane(
        currentTransformationMatrix,
        translationVectorWorld,
        Vector3.create(0, 0, 1)
      );
    case 'xz-translate':
      return performTranslationConstrainedToPlane(
        currentTransformationMatrix,
        translationVectorWorld,
        Vector3.create(0, 1, 0)
      );
    case 'yz-translate':
      return performTranslationConstrainedToPlane(
        currentTransformationMatrix,
        translationVectorWorld,
        Vector3.create(1, 0, 0)
      );
    case 'x-rotate':
      return performRotationAroundAxis(
        currentTransformationMatrix,
        viewVector,
        Vector3.right(),
        angle
      );
    case 'y-rotate':
      return performRotationAroundAxis(
        currentTransformationMatrix,
        viewVector,
        Vector3.up(),
        angle
      );
    case 'z-rotate':
      return performRotationAroundAxis(
        currentTransformationMatrix,
        viewVector,
        Vector3.forward(),
        angle
      );
    default:
      return currentTransformationMatrix;
  }
}

export function performRotationAroundAxis(
  currentTransformationMatrix: Matrix4.Matrix4,
  viewVector: Vector3.Vector3,
  localRotationAxis: Vector3.Vector3,
  rotationAngle: number
): Matrix4.Matrix4 {
  // Determine the rotation axis in world coordinates
  const worldRotationAxis = computeRotationAxis(
    currentTransformationMatrix,
    viewVector,
    localRotationAxis
  );

  // Determine the rotation matrix in world coordinates
  const worldRotationQuaternion = Quaternion.fromAxisAngle(
    worldRotationAxis,
    rotationAngle
  );
  const worldRotationMatrix = Matrix4.makeRotation(worldRotationQuaternion);

  return Matrix4.multiply(currentTransformationMatrix, worldRotationMatrix);
}

export function computeRotationAxis(
  currentTransformationMatrix: Matrix4.Matrix4,
  viewVector: Vector3.Vector3,
  localRotationAxis: Vector3.Vector3
): Vector3.Vector3 {
  const changeOfBasisToWorld = Matrix4.makeRotation(
    Quaternion.fromMatrixRotation(currentTransformationMatrix)
  );
  const worldRotationAxis = Vector3.transformMatrix(
    localRotationAxis,
    changeOfBasisToWorld
  );
  const worldNegatedRotationAxis = Vector3.transformMatrix(
    Vector3.negate(localRotationAxis),
    changeOfBasisToWorld
  );

  return Vector3.dot(viewVector, worldRotationAxis) >
    Vector3.dot(viewVector, worldNegatedRotationAxis)
    ? localRotationAxis
    : Vector3.negate(localRotationAxis);
}

export function performTranslationConstrainedToAxis(
  currentTransformationMatrix: Matrix4.Matrix4,
  translationVectorWorld: Vector3.Vector3,
  constrainToLocalAxis: Vector3.Vector3
): Matrix4.Matrix4 {
  // Ensure that constrainToLocalAxis is a unit vector
  const constrainToLocalAxisUnitVector =
    Vector3.normalize(constrainToLocalAxis);

  // Convert the axis to constrain the translation to from local to world
  const changeOfBasisToWorld = Matrix4.makeRotation(
    Quaternion.fromMatrixRotation(currentTransformationMatrix)
  );
  const constrainToWorldAxis = Vector3.transformMatrix(
    constrainToLocalAxisUnitVector,
    changeOfBasisToWorld
  );

  // Project the translation vector onto the desired axis for translation
  const translationVectorProjectedToWorldAxis = Vector3.project(
    translationVectorWorld,
    constrainToWorldAxis
  );

  // Use the projected vector to determine the translation matrix
  const translationMatrix = Matrix4.makeTranslation(
    translationVectorProjectedToWorldAxis
  );

  // Multiply the translation matrix with the current transformation matrix to
  // determine the new transformation matrix
  return Matrix4.multiply(translationMatrix, currentTransformationMatrix);
}

export function performTranslationConstrainedToPlane(
  currentTransformationMatrix: Matrix4.Matrix4,
  translationVectorWorld: Vector3.Vector3,
  localNormalVectorToPlane: Vector3.Vector3
): Matrix4.Matrix4 {
  // Ensure that localNormalVectorToPlane is a unit vector
  const localNormalVectorToPlaneUnitVector = Vector3.normalize(
    localNormalVectorToPlane
  );

  // Convert the normal vector from local to world
  const changeOfBasisToWorld = Matrix4.makeRotation(
    Quaternion.fromMatrixRotation(currentTransformationMatrix)
  );
  const worldNormalVectorToPlane = Vector3.transformMatrix(
    localNormalVectorToPlaneUnitVector,
    changeOfBasisToWorld
  );

  // Use the worldNormalVectorToPlane and the current position of the widget to define the plane to translate on
  const currentPosition = Vector3.create(
    currentTransformationMatrix[12],
    currentTransformationMatrix[13],
    currentTransformationMatrix[14]
  );
  const worldPlaneToConstrainTranslationTo = Plane.fromNormalAndCoplanarPoint(
    worldNormalVectorToPlane,
    currentPosition
  );

  // Project the translation vector onto the desired plane for translation
  const translationVectorProjectedToWorldPlane = Plane.projectPoint(
    worldPlaneToConstrainTranslationTo,
    translationVectorWorld
  );

  // Account for the plane offset to calculate the position change (the vector to translate by)
  const constrainedTranslationVector = Vector3.add(
    translationVectorProjectedToWorldPlane,
    Vector3.scale(
      worldPlaneToConstrainTranslationTo.constant,
      worldPlaneToConstrainTranslationTo.normal
    )
  );

  // Use the projected vector to perform the translation and determine the new transformation matrix
  const translationMatrix = Matrix4.makeTranslation(
    constrainedTranslationVector
  );
  return Matrix4.multiply(translationMatrix, currentTransformationMatrix);
}

export function computeInputPosition(
  viewport: Viewport,
  bounds: Rectangle.Rectangle,
  shapePoints: Point.Point[]
): PointAndPlacement {
  if (shapePoints.length === 0) {
    throw new Error(
      'Unable to compute input position. At least one shape point must be provided.'
    );
  }

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
      return { point: closestPoint, placement: 'top-left' };
    case topRight:
      return { point: closestPoint, placement: 'top-right' };
    case bottomLeft:
      return { point: closestPoint, placement: 'bottom-left' };
    default:
      return { point: closestPoint, placement: 'bottom-right' };
  }
}

export function calculateNewRotationAngle(
  event: PointerEvent,
  rotationSnapKey: ModifierKey,
  angleOfRotation: number, // In radians
  lastAngle: number, // In radians
  existingAngle?: number, // In degrees
  rotationSnapDegrees?: number // In degrees
): number {
  const rotationSnapKeyIsHeld =
    (rotationSnapKey === 'alt' && event.altKey) ||
    (rotationSnapKey === 'ctrl' && event.ctrlKey) ||
    (rotationSnapKey === 'meta' && event.metaKey) ||
    (rotationSnapKey === 'shift' && event.shiftKey);

  // Check if the widget should snap to a certain angle
  if (
    rotationSnapKeyIsHeld &&
    rotationSnapDegrees != null &&
    rotationSnapDegrees > 0 &&
    Number.isInteger(rotationSnapDegrees)
  ) {
    const angleChangeRelativeToLastAngle = angleOfRotation - lastAngle;
    const angleChangeRelativeToLastAngleDegrees = Angle.toDegrees(
      angleChangeRelativeToLastAngle
    );

    // This method rounds the angle change to the nearest multiple of this.rotationSnapDegrees
    const angleChangeRounded =
      Math.round(angleChangeRelativeToLastAngleDegrees / rotationSnapDegrees) *
      rotationSnapDegrees;

    // Check if there is already an existing rotation angle
    if (existingAngle != null) {
      // If there is an existing angle displayed in the widget, it might not be a multiple of the
      // desired number, so the difference needs to be accounted for
      const existingAngleRounded =
        Math.round(existingAngle / rotationSnapDegrees) * rotationSnapDegrees;
      const neededAdjustmentDueToExistingAngle =
        existingAngle - existingAngleRounded;

      // Adjust the rounded angle change to account for the existing angle, then
      // covert the rounded value to radians and return
      const adjustedAngle =
        angleChangeRounded - neededAdjustmentDueToExistingAngle;
      const angleChangeRoundedRadians = Angle.toRadians(adjustedAngle);
      return angleChangeRoundedRadians + lastAngle;
    } else {
      // There isn't an existing angle to account for, so convert the rounded value to radians and return
      const angleChangeRoundedRadians = Angle.toRadians(angleChangeRounded);
      return angleChangeRoundedRadians + lastAngle;
    }
  } else {
    // Angle should not be snapped, so return the original angle
    return angleOfRotation;
  }
}

function appliedToCurrent(
  current: Matrix4.Matrix4,
  delta: Matrix4.Matrix4
): Matrix4.Matrix4 {
  return Matrix4.multiply(
    Matrix4.multiply(current, delta),
    Matrix4.invert(current)
  );
}
