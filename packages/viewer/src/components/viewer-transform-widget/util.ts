import {
  Matrix4,
  Plane,
  Point,
  Quaternion,
  Ray,
  Vector3,
} from '@vertexvis/geometry';

import { Frame, Viewport } from '../../lib/types';

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

function computeRotation(
  rotationAxis: Quaternion.Quaternion,
  current: Matrix4.Matrix4
): Matrix4.Matrix4 {
  return Matrix4.multiply(
    Matrix4.multiply(
      Matrix4.multiply(
        Matrix4.makeTranslation(Vector3.fromMatrixPosition(current)),
        Matrix4.makeRotation(rotationAxis)
      ),
      Matrix4.makeTranslation(
        Vector3.negate(Vector3.fromMatrixPosition(current))
      )
    ),
    current
  );
}
