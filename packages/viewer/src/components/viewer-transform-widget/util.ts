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
      const rotationAxis =
        Vector3.dot(viewVector, Vector3.right()) >
        Vector3.dot(viewVector, Vector3.left())
          ? Vector3.right()
          : Vector3.left();

      return computeRotation(
        Quaternion.fromAxisAngle(rotationAxis, angle),
        current
      );
    }
    case 'y-rotate': {
      const rotationAxis =
        Vector3.dot(viewVector, Vector3.up()) >
        Vector3.dot(viewVector, Vector3.down())
          ? Vector3.up()
          : Vector3.down();

      return computeRotation(
        Quaternion.fromAxisAngle(rotationAxis, angle),
        current
      );
    }
    case 'z-rotate': {
      const rotationAxis =
        Vector3.dot(viewVector, Vector3.forward()) >
        Vector3.dot(viewVector, Vector3.back())
          ? Vector3.forward()
          : Vector3.back();

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
