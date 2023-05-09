import { Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';

import { random, randomNormalVector3, randomVector3 } from '../../../testing';
import * as TransformationDelta from '../transformation-delta';

describe('transformation delta functions', () => {
  const generatedExpectedRotation = (
    normal1: Vector3.Vector3,
    normal2: Vector3.Vector3
  ): Matrix4.Matrix4 => {
    const direction = Vector3.normalize(Vector3.cross(normal1, normal2));

    const angle = Vector3.angleTo(normal2, normal1);
    return Matrix4.makeRotation(
      Quaternion.fromAxisAngle(direction, angle + Math.PI)
    );
  };
  describe('calculateOrthogonalCoordinate', () => {
    it('returns a normalized orthogonal vector cross the normal with (0, z, -y)', () => {
      const normal = Vector3.create(1, 2, 3);

      const result = TransformationDelta.calculateOrthogonalCoordinate(normal);

      expect(result).toEqual(
        Vector3.normalize(
          Vector3.cross(
            normal,
            Vector3.normalize(Vector3.create(0, normal.z, -normal.y))
          )
        )
      );
    });

    it('returns a normalized orthogonal vector cross the normal with (-z, 0, x)', () => {
      const normal = Vector3.create(3, 2, 1);

      const result = TransformationDelta.calculateOrthogonalCoordinate(normal);

      expect(result).toEqual(
        Vector3.normalize(
          Vector3.cross(
            normal,
            Vector3.normalize(Vector3.create(-normal.z, 0, normal.x))
          )
        )
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
        0.14772550097833792, -0.8915748018863913, -0.42810226465406753, 0,
        -0.8915748018863913, -0.3074078891850285, 0.33255790820253756, 0,
        -0.4281022646540674, 0.3325579082025378, -0.8403176117933095, 0, 0, 0,
        0, 1,
      ]);
    });

    it('compute based on the normalized cross of the two normals + PI - static output', () => {
      const normal1 = Vector3.normalize(
        Vector3.create(
          0.1993226759480711,
          0.8827308315910894,
          0.4255076377826886
        )
      );
      const normal2 = Vector3.normalize(
        Vector3.create(
          0.8725693698462239,
          0.3901546914165199,
          0.2939421908672582
        )
      );
      const result = TransformationDelta.computeRotationMatrix(
        normal1,
        normal2
      );

      expect(result).toEqual([
        -0.6189055856631775, 0.7744285252647052, 0.13121103342041504, 0,
        -0.6105258914121656, -0.36920312455323145, -0.7006762367424141, 0,
        -0.4941801411937754, -0.5137601698034454, 0.7013105417525358, 0, 0, 0,
        0, 1,
      ]);
    });

    it('compute based on the normalized cross of the two normals + PI case xy/yz', () => {
      const normal1 = Vector3.normalize(
        Vector3.create({
          x: random.integer({ min: 1, max: 10 }),
          y: random.integer({ min: 1, max: 10 }),
          z: 0,
        })
      );
      const normal2 = Vector3.normalize(
        Vector3.create({
          x: 0,
          y: random.integer({
            min: 1,
            max: 10,
          }),
          z: random.integer({ min: 1, max: 10 }),
        })
      );

      const result = TransformationDelta.computeRotationMatrix(
        normal1,
        normal2
      );

      expect(result).toEqual(generatedExpectedRotation(normal1, normal2));
    });
  });

  it('compute based on the normalized cross of the two normals + PI case xz/xy', () => {
    const normal1 = Vector3.normalize(
      Vector3.create({
        x: random.integer({ min: 1, max: 10 }),
        y: 0,
        z: random.integer({ min: 1, max: 10 }),
      })
    );
    const normal2 = Vector3.normalize(
      Vector3.create({
        x: random.integer({
          min: 1,
          max: 10,
        }),
        y: random.integer({
          min: 1,
          max: 10,
        }),
        z: 0,
      })
    );

    const result = TransformationDelta.computeRotationMatrix(normal1, normal2);

    expect(result).toEqual(generatedExpectedRotation(normal1, normal2));
  });

  it('compute based on the normalized cross of the two normals + PI case yz/xz', () => {
    const normal1 = Vector3.normalize(
      Vector3.create({
        x: 0,
        y: random.integer({ min: 1, max: 10 }),
        z: random.integer({ min: 1, max: 10 }),
      })
    );
    const normal2 = Vector3.normalize(
      Vector3.create({
        x: random.integer({
          min: 1,
          max: 10,
        }),
        y: 0,
        z: random.integer({ min: 1, max: 10 }),
      })
    );
    const result = TransformationDelta.computeRotationMatrix(normal1, normal2);
    expect(result).toEqual(generatedExpectedRotation(normal1, normal2));
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
