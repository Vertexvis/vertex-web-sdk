import { Angle, Vector3 } from '@vertexvis/geometry';

/**
 * A type representing the different types of supported distance units.
 */
export type DistanceUnitType =
  // Metric
  | 'millimeters'
  | 'centimeters'
  | 'meters'

  // Imperial
  | 'inches'
  | 'feet'
  | 'yards';

export type AngleUnitType = 'degrees' | 'radians';

interface Unit {
  name: string;
  abbreviatedName: string;
  converter: UnitConverter<number>;
}

interface UnitConverter<T> {
  convertTo(value: T): T;
  convertFrom(value: T): T;
}

class ScaledUnitConverter implements UnitConverter<number> {
  public constructor(public readonly scale: number) {}

  public convertTo(value: number): number {
    return value * this.scale;
  }

  public convertFrom(value: number): number {
    return value / this.scale;
  }
}

class MillimeterUnitConverter extends ScaledUnitConverter {
  public constructor() {
    super(1);
  }
}

class CentimeterUnitConverter extends ScaledUnitConverter {
  public constructor(power = 1) {
    super(1 / Math.pow(10, power));
  }
}

class MeterUnitConverter extends ScaledUnitConverter {
  public constructor(power = 1) {
    super(1 / Math.pow(1000, power));
  }
}

class InchesUnitConverter extends ScaledUnitConverter {
  public constructor(power = 1) {
    super(1 / Math.pow(25.4, power));
  }
}

class FeetUnitConverter extends ScaledUnitConverter {
  public constructor(power = 1) {
    super(1 / Math.pow(25.4 * 12, power));
  }
}

class YardUnitConverter extends ScaledUnitConverter {
  public constructor(power = 1) {
    super(1 / Math.pow(25.4 * 12 * 3, power));
  }
}

/**
 * A class that contains helpers for transforming values and points between
 * world space distances and real space distances.
 */
export class DistanceUnits {
  private static units: Record<DistanceUnitType, Unit> = {
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

  public constructor(public readonly unitType: DistanceUnitType) {
    this.unit = DistanceUnits.units[unitType];
  }

  /**
   * Translates a world space value to a real space value.
   *
   * @param value A world space value to translate.
   * @returns A value in real space units.
   */
  public convertWorldValueToReal(value: number): number {
    return this.unit.converter.convertTo(value);
  }

  /**
   * Translates a real space value to a world space value.
   *
   * @param value A real space value to translate.
   * @returns A world space value.
   */
  public convertRealValueToWorld(value: number): number {
    return this.unit.converter.convertFrom(value);
  }

  /**
   * Translates a world space point to a point in real space.
   *
   * @param pt A point in world space.
   * @returns A point in real space.
   */
  public convertWorldPointToReal(pt: Vector3.Vector3): Vector3.Vector3 {
    const x = this.unit.converter.convertTo(pt.x);
    const y = this.unit.converter.convertTo(pt.y);
    const z = this.unit.converter.convertTo(pt.z);
    return { x, y, z };
  }

  /**
   * Translates a real space point to a point in world space.
   *
   * @param pt A point in real space.
   * @returns A point in world space.
   */
  public convertRealPointToWorld(pt: Vector3.Vector3): Vector3.Vector3 {
    const x = this.unit.converter.convertFrom(pt.x);
    const y = this.unit.converter.convertFrom(pt.y);
    const z = this.unit.converter.convertFrom(pt.z);
    return { x, y, z };
  }
}

class RadiansToDegreesUnitConverter implements UnitConverter<number> {
  public convertTo(radians: number): number {
    return Angle.toDegrees(radians);
  }

  public convertFrom(degrees: number): number {
    return Angle.toRadians(degrees);
  }
}

/**
 * A class that contains helpers for transforming angle units.
 */
export class AngleUnits {
  private static units: Record<AngleUnitType, Unit> = {
    radians: {
      name: 'Radians',
      abbreviatedName: 'rad',
      converter: new ScaledUnitConverter(1),
    },
    degrees: {
      name: 'Degrees',
      abbreviatedName: 'deg',
      converter: new RadiansToDegreesUnitConverter(),
    },
  };

  /**
   * The unit of this measurement.
   */
  public readonly unit: Unit;

  public constructor(public readonly unitType: AngleUnitType) {
    this.unit = AngleUnits.units[unitType];
  }

  /**
   * Converts radians to the chosen unit type.
   *
   * @param radians An angle in radians.
   * @returns An angle in the chosen unit type.
   */
  public convertTo(radians: number): number {
    return this.unit.converter.convertTo(radians);
  }

  /**
   * Converts the chosen unit type back to radians.
   *
   * @param value The value to convert
   * @returns An angle in radians.
   */
  public convertFrom(value: number): number {
    return this.unit.converter.convertFrom(value);
  }
}

/**
 * A class that contains helpers for transforming area units.
 */
export class AreaUnits {
  private static units: Record<DistanceUnitType, Unit> = {
    millimeters: {
      name: 'Square Millimeters',
      abbreviatedName:
        'mm<span class=measurement-details-entry-label-superscript>2</span>',
      converter: new MillimeterUnitConverter(),
    },
    centimeters: {
      name: 'Square Centimeters',
      abbreviatedName:
        'cm<span class=measurement-details-entry-label-superscript>2</span>',
      converter: new CentimeterUnitConverter(2),
    },
    meters: {
      name: 'Square Meters',
      abbreviatedName:
        'm<span class=measurement-details-entry-label-superscript>2</span>',
      converter: new MeterUnitConverter(2),
    },
    inches: {
      name: 'Square Inches',
      abbreviatedName:
        'in<span class=measurement-details-entry-label-superscript>2</span>',
      converter: new InchesUnitConverter(2),
    },
    feet: {
      name: 'Square Feet',
      abbreviatedName:
        'ft<span class=measurement-details-entry-label-superscript>2</span>',
      converter: new FeetUnitConverter(2),
    },
    yards: {
      name: 'Square Yards',
      abbreviatedName:
        'yd<span class=measurement-details-entry-label-superscript>2</span>',
      converter: new YardUnitConverter(2),
    },
  };

  /**
   * The unit of this measurement.
   */
  public readonly unit: Unit;

  public constructor(public readonly unitType: DistanceUnitType) {
    this.unit = AreaUnits.units[unitType];
  }

  /**
   * Translates a world space value to a real space value.
   *
   * @param value A world space value to translate.
   * @returns A value in real space units.
   */
  public convertWorldValueToReal(value: number): number {
    return this.unit.converter.convertTo(value);
  }

  /**
   * Translates a real space value to a world space value.
   *
   * @param value A real space value to translate.
   * @returns A world space value.
   */
  public convertRealValueToWorld(value: number): number {
    return this.unit.converter.convertFrom(value);
  }
}
