/**
 * A `FeatureMap` represents the surfaces, edges and cross sections rendered in
 * a frame.
 */
export class FeatureMap {
  /**
   * Constructor.
   *
   * @param pixels The pixels containing feature information of a frame.
   */
  public constructor(private readonly pixels: Uint8Array) {}
}
