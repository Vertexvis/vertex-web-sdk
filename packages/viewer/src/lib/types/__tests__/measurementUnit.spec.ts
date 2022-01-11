import { Vector3 } from '@vertexvis/geometry';

import {
  AreaUnits,
  DistanceUnits,
  DistanceUnitType,
} from '../measurementUnits';

interface DisanceUnitTest {
  unitType: DistanceUnitType;
  worldUnit: number;
  realUnit: number;
}

interface AreaUnitTest {
  unitType: DistanceUnitType;
  worldUnit: number;
  realUnit: number;
}

describe(DistanceUnits, () => {
  const tests: DisanceUnitTest[] = [
    { unitType: 'millimeters', worldUnit: 1, realUnit: 1 },
    { unitType: 'centimeters', worldUnit: 1, realUnit: 1 / 10 },
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

describe(AreaUnits, () => {
  const tests: AreaUnitTest[] = [
    { unitType: 'millimeters', worldUnit: 1, realUnit: 1 },
    { unitType: 'centimeters', worldUnit: 1, realUnit: 1 / Math.pow(10, 2) },
    { unitType: 'meters', worldUnit: 1, realUnit: 1 / Math.pow(1000, 2) },
    { unitType: 'inches', worldUnit: 1, realUnit: 1 / Math.pow(25.4, 2) },
    { unitType: 'feet', worldUnit: 1, realUnit: 1 / Math.pow(25.4 * 12, 2) },
    {
      unitType: 'yards',
      worldUnit: 1,
      realUnit: 1 / Math.pow(25.4 * 12 * 3, 2),
    },
  ];

  describe(AreaUnits.prototype.convertWorldValueToReal, () => {
    it('translates a world value to real value', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new AreaUnits(unitType);
        expect(measurementUnit.convertWorldValueToReal(worldUnit)).toEqual(
          realUnit
        );
      }
    });
  });

  describe(AreaUnits.prototype.convertRealValueToWorld, () => {
    it('translates a real value to world value', () => {
      for (const { unitType, realUnit, worldUnit } of tests) {
        const measurementUnit = new AreaUnits(unitType);
        expect(measurementUnit.convertRealValueToWorld(realUnit)).toEqual(
          worldUnit
        );
      }
    });
  });
});
