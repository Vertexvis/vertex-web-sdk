/**
 * Provides the depth for a specific location.
 */
export type DepthProvider<T> = (location: T) => Promise<number>;
