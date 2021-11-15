import { Vector3 } from '@vertexvis/geometry';
import { DistanceUnits, DistanceUnitType } from '../measurementUnits';

interface Test {
  unitType: DistanceUnitType;
  worldUnit: number;
  realUnit: number;
}

describe(DistanceUnits, () => {
  const tests: Test[] = [
    { unitType: 'millimeters', worldUnit: 1, realUnit: 1 },
    { unitType: 'centimeters', worldUnit: 1, realUnit: 1 / 100 },
    { unitType: 'meters', worldUnit: 1, realUnit: 1 / 1000 },
    { unitType: 'inches', worldUnit: 1, realUnit: 1 / 25.4 },
    { unitType: 'feet', worldUnit: 1, realUnit: 1 / (25.4 * 12) },
    { unitType: 'yards', worldUnit: 1, realUnit: 1 / (25.4 * 12 * 3) },
  ];

  describe(DistanceUnits.prototype.convertWorldValueToReal, () => {
    it('translates a world value to real value', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new DistanceUnits(unitType);
        expect(measurementUnit.convertWorldValueToReal(worldUnit)).toEqual(
          realUnit
        );
      }
    });
  });

  describe(DistanceUnits.prototype.convertRealValueToWorld, () => {
    it('translates a real value to world value', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new DistanceUnits(unitType);
        expect(measurementUnit.convertRealValueToWorld(realUnit)).toEqual(
          worldUnit
        );
      }
    });
  });

  describe(DistanceUnits.prototype.convertWorldPointToReal, () => {
    it('translates a world point to real point', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new DistanceUnits(unitType);
        const worldPt = Vector3.create(worldUnit, worldUnit, worldUnit);
        const realPt = Vector3.create(realUnit, realUnit, realUnit);
        expect(measurementUnit.convertWorldPointToReal(worldPt)).toEqual(
          realPt
        );
      }
    });
  });

  describe(DistanceUnits.prototype.convertRealPointToWorld, () => {
    it('translates a real point to a world point', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new DistanceUnits(unitType);
        const worldPt = Vector3.create(worldUnit, worldUnit, worldUnit);
        const realPt = Vector3.create(realUnit, realUnit, realUnit);
        expect(measurementUnit.convertRealPointToWorld(realPt)).toEqual(
          worldPt
        );
      }
    });
  });
});
