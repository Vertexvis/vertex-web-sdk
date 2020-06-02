/**
 * A `Disposable` represents a type with a `dispose` method that when called
 * releases any resources associated to the object.
 */
export interface Disposable {
  /**
   * Disposes any resources associated with the object.
   */
  dispose(): void;
}
