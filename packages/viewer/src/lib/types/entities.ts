// The source of these values are from:
// https://github.com/Vertexvis/rendering-worker-service/blob/fc1c864d1da4b5eb12794478dc720fa046412ee2/src/embree.isph#L163

/**
 * An enumeration of the possible types of entities in a frame.
 */
export enum EntityType {
  /**
   * A value that represents the presence of a cross section.
   */
  CROSS_SECTION = 0xff, // == 255

  /**
   * A value that represents the presence of an edge with BREP.
   */
  PRECISE_EDGE = 0xe0, // == 224

  /**
   * A value that represents the presence of a surface with BREP.
   */
  PRECISE_SURFACE = 0xc0, // == 192

  /**
   * A value that represents the presence of an edge without BREP.
   */
  IMPRECISE_EDGE = 0xa0, // == 160

  /**
   * A value that represents the presence of an surface without BREP.
   */
  IMPRECISE_SURFACE = 0x80, // == 128

  /**
   * A value that represents the presence of geometry without BREP.
   */
  GENERIC_GEOMETRY = 0x60, // == 96
}
