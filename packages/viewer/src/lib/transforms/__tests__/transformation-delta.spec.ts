import { Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';

import { random, randomNormalVector3, randomVector3 } from '../../../testing';
import * as TransformationDelta from '../transformation-delta';

describe('transformation delta functions', () => {
  describe('chooseOrthogonalVector', () => {
    it('returns a normalized orthogonal vector cross the normal with (1, 0, 0)', () => {
      const normal = Vector3.create(1, 2, 3);
      const result = TransformationDelta.chooseOrthogonalVector(normal);

      expect(result).toEqual(
        Vector3.normalize(Vector3.cross(normal, Vector3.create(1, 0, 0)))
      );
    });

    it('returns a normalized orthogonal vector cross the normal with (0, 1, 0)', () => {
      const normal = Vector3.create(2, 1, 3);

      const result = TransformationDelta.chooseOrthogonalVector(normal);

      expect(result).toEqual(
        Vector3.normalize(Vector3.cross(normal, Vector3.create(0, 1, 0)))
      );
    });

    it('returns a normalized orthogonal vector cross the normal with (0, 0, 1)', () => {
      const normal = Vector3.create(3, 2, 1);

      const result = TransformationDelta.chooseOrthogonalVector(normal);

      expect(result).toEqual(
        Vector3.normalize(Vector3.cross(normal, Vector3.create(0, 0, 1)))
      );
    });
  });

  describe('computeRotationMatrix', () => {
    it('return the identity matrix when the angle is 180', () => {
      const normal = randomNormalVector3();

      const result = TransformationDelta.computeRotationMatrix(
        normal,
        Vector3.scale(-1, normal)
      );

      expect(result).toEqual(Matrix4.makeIdentity());
    });

    it('should handle the cases where the angle between two normals is 0', () => {
      const normal = Vector3.normalize(Vector3.create(0.6289, 0.6579, 0.3159));
      const result = TransformationDelta.computeRotationMatrix(normal, normal);

      expect(result).toEqual([
        0.045050168671940005, -0.9989847257604241, 8.462255466143613e-17, 0,
        -0.9989847257604241, -0.045050168671940005, 8.852469186159776e-17, 0,
        -8.462255466143613e-17, -8.852469186159776e-17, -1, 0, 0, 0, 0, 1,
      ]);
    });

    it('compute based on the normalized cross of the two normals + PI', () => {
      const normal1 = randomNormalVector3();
      const normal2 = randomNormalVector3();

      const direction = Vector3.normalize(Vector3.cross(normal1, normal2));

      const angle = Vector3.angleTo(normal2, normal1);
      const expected = Matrix4.makeRotation(
        Quaternion.fromAxisAngle(direction, angle + Math.PI)
      );
      const result = TransformationDelta.computeRotationMatrix(
        normal1,
        normal2
      );

      expect(result).toEqual(expected);
    });
  });

  describe('computeTransformationDelta', () => {
    it('should only update the position when the rotation is not needed to change', () => {
      const position1 = randomVector3();
      const position2 = randomVector3();

      const normal1 = randomNormalVector3();
      const normal2 = Vector3.scale(-1, normal1);

      const matrix = TransformationDelta.computeTransformationDelta(
        normal1,
        position1,
        normal2,
        position2
      );

      const expectedTranslationMatrixDelta = Matrix4.makeTranslation(
        Vector3.subtract(position2, position1)
      );

      expect(matrix).toMatchObject(expectedTranslationMatrixDelta);
    });

    it('should only update the rotation when the position is not needed to change', () => {
      const position = randomVector3();

      const normal1 = randomNormalVector3();
      const normal2 = randomNormalVector3();

      const matrix = Matrix4.toObject(
        TransformationDelta.computeTransformationDelta(
          normal1,
          position,
          normal2,
          position
        )
      );

      const expectedTranslationMatrixDelta = Matrix4.toObject(
        TransformationDelta.computeRotationMatrix(normal1, normal2)
      );

      expect(matrix).toMatchObject({
        ...expectedTranslationMatrixDelta,
        m14: matrix.m14,
        m24: matrix.m24,
        m34: matrix.m34,
      });
    });

    it('should only handle updating the translation when all values are random - static test', () => {
      const position1 = Vector3.create(
        -587706686819.5328,
        13948870983.68,
        633868784762.88
      );
      const position2 = Vector3.create(
        -278040905829.5808,
        656032649759.9489,
        -672287245415.2192
      );

      const normal1 = Vector3.normalize(
        Vector3.create(
          0.0317054253956362,
          0.14174190176872653,
          0.9893957748461767
        )
      );

      const normal2 = Vector3.normalize(
        Vector3.create(
          0.241741901762653,
          0.3317054253956362,
          0.5893957748461767
        )
      );

      const matrix = TransformationDelta.computeTransformationDelta(
        normal1,
        position1,
        normal2,
        position2
      );

      expect(matrix).toEqual([
        0.14836724718474947, -0.9010272279130054, 0.4075991836623629, 0,
        -0.9671566838191503, -0.046186337244424225, 0.24994953729880917, 0,
        -0.2063858253533025, -0.43129659958240985, -0.8782870454936058, 0,
        -46532206441.51807, 400522621618.1041, 120493748717.13489, 1,
      ]);
    });
  });
});
