import { Vector3 } from '@vertexvis/geometry';
import { MeasurementUnits, UnitType } from '../measurementUnits';

interface Test {
  unitType: UnitType;
  worldUnit: number;
  realUnit: number;
}

describe(MeasurementUnits, () => {
  const tests: Test[] = [
    { unitType: 'millimeters', worldUnit: 1, realUnit: 1 },
    { unitType: 'centimeters', worldUnit: 1, realUnit: 1 / 100 },
    { unitType: 'meters', worldUnit: 1, realUnit: 1 / 1000 },
    { unitType: 'inches', worldUnit: 1, realUnit: 1 / 25.4 },
    { unitType: 'feet', worldUnit: 1, realUnit: 1 / (25.4 * 12) },
    { unitType: 'yards', worldUnit: 1, realUnit: 1 / (25.4 * 12 * 3) },
  ];

  describe(MeasurementUnits.prototype.translateWorldValueToReal, () => {
    it('translates a world value to real value', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new MeasurementUnits(unitType);
        expect(measurementUnit.translateWorldValueToReal(worldUnit)).toEqual(
          realUnit
        );
      }
    });
  });

  describe(MeasurementUnits.prototype.translateRealValueToWorld, () => {
    it('translates a real value to world value', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new MeasurementUnits(unitType);
        expect(measurementUnit.translateRealValueToWorld(realUnit)).toEqual(
          worldUnit
        );
      }
    });
  });

  describe(MeasurementUnits.prototype.translateWorldPointToReal, () => {
    it('translates a world point to real point', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new MeasurementUnits(unitType);
        const worldPt = Vector3.create(worldUnit, worldUnit, worldUnit);
        const realPt = Vector3.create(realUnit, realUnit, realUnit);
        expect(measurementUnit.translateWorldPointToReal(worldPt)).toEqual(
          realPt
        );
      }
    });
  });

  describe(MeasurementUnits.prototype.translateRealPointToWorld, () => {
    it('translates a real point to a world point', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new MeasurementUnits(unitType);
        const worldPt = Vector3.create(worldUnit, worldUnit, worldUnit);
        const realPt = Vector3.create(realUnit, realUnit, realUnit);
        expect(measurementUnit.translateRealPointToWorld(realPt)).toEqual(
          worldPt
        );
      }
    });
  });
});
