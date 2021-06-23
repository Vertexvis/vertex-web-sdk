import { Vector3 } from '@vertexvis/geometry';

/**
 * A type representing the different types of supported units.
 */
export type UnitType =
  // Metric
  | 'millimeters'
  | 'centimeters'
  | 'meters'

  // Imperial
  | 'inches'
  | 'feet'
  | 'yards';

interface Unit {
  name: string;
  abbreviatedName: string;
  converter: UnitConverter<number>;
}

interface UnitConverter<T> {
  translateWorldToReal(value: T): T;
  translateRealToWorld(value: T): T;
}

class ScaledUnitConverter implements UnitConverter<number> {
  public constructor(private readonly scale: number) {}

  public translateWorldToReal(value: number): number {
    return value * this.scale;
  }

  public translateRealToWorld(value: number): number {
    return value / this.scale;
  }
}

class MillimeterUnitConverter extends ScaledUnitConverter {
  public constructor() {
    super(1);
  }
}

class CentimeterUnitConverter extends ScaledUnitConverter {
  public constructor() {
    super(1 / 100);
  }
}

class MeterUnitConverter extends ScaledUnitConverter {
  public constructor() {
    super(1 / 1000);
  }
}

class InchesUnitConverter extends ScaledUnitConverter {
  public constructor() {
    super(1 / 25.4);
  }
}

class FeetUnitConverter extends ScaledUnitConverter {
  public constructor() {
    super(1 / (25.4 * 12));
  }
}

class YardUnitConverter extends ScaledUnitConverter {
  public constructor() {
    super(1 / (25.4 * 12 * 3));
  }
}

/**
 * A class that contains helpers for transforming values and points between
 * world space and real space.
 */
export class MeasurementUnits {
  private static units: Record<UnitType, Unit> = {
    millimeters: {
      name: 'Millimeters',
      abbreviatedName: 'mm',
      converter: new MillimeterUnitConverter(),
    },
    centimeters: {
      name: 'Centimeters',
      abbreviatedName: 'cm',
      converter: new CentimeterUnitConverter(),
    },
    meters: {
      name: 'Meters',
      abbreviatedName: 'm',
      converter: new MeterUnitConverter(),
    },

    inches: {
      name: 'Inches',
      abbreviatedName: 'in',
      converter: new InchesUnitConverter(),
    },
    feet: {
      name: 'Feet',
      abbreviatedName: 'ft',
      converter: new FeetUnitConverter(),
    },
    yards: {
      name: 'Yards',
      abbreviatedName: 'yd',
      converter: new YardUnitConverter(),
    },
  };

  /**
   * The unit of this measurement.
   */
  public readonly unit: Unit;

  public constructor(public readonly unitType: UnitType) {
    this.unit = MeasurementUnits.units[unitType];
  }

  /**
   * Translates a world space value to a real space value.
   *
   * @param value A world space value to translate.
   * @returns A value in real space units.
   */
  public translateWorldValueToReal(value: number): number {
    return this.unit.converter.translateWorldToReal(value);
  }

  /**
   * Translates a real space value to a world space value.
   *
   * @param value A real space value to translate.
   * @returns A world space value.
   */
  public translateRealValueToWorld(value: number): number {
    return this.unit.converter.translateRealToWorld(value);
  }

  /**
   * Translates a world space point to a point in real space.
   *
   * @param pt A point in world space.
   * @returns A point in real space.
   */
  public translateWorldPointToReal(pt: Vector3.Vector3): Vector3.Vector3 {
    const x = this.unit.converter.translateWorldToReal(pt.x);
    const y = this.unit.converter.translateWorldToReal(pt.y);
    const z = this.unit.converter.translateWorldToReal(pt.z);
    return { x, y, z };
  }

  /**
   * Translates a real space point to a point in world space.
   *
   * @param pt A point in real space.
   * @returns A point in world space.
   */
  public translateRealPointToWorld(pt: Vector3.Vector3): Vector3.Vector3 {
    const x = this.unit.converter.translateRealToWorld(pt.x);
    const y = this.unit.converter.translateRealToWorld(pt.y);
    const z = this.unit.converter.translateRealToWorld(pt.z);
    return { x, y, z };
  }
}
