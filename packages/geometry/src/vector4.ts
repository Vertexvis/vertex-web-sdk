/**
 * A `Vector4` represents a vector of 4 dimension values. It may represent a
 * point or direction. It may also be used to represent a quadruplet of values,
 * such as a row or column in a transformation matrix.
 */
export interface Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Returns a new Vector4. If `value` is undefined, then `{x: 0, y: 0, z: 0,
 * w: 0}` is returned.
 */
export function create(value: Partial<Vector4> = {}): Vector4 {
  return { x: 0, y: 0, z: 0, w: 0, ...value };
}

/**
 * Parses a JSON string representation of a `Vector4`.
 *
 * @param json A JSON string either in the form of `[x, y, z, w]` or `{"x": 0, "y": 0, "z": 0, "w": 0}`.
 * @returns A parsed `Vector4`.
 */
export function fromJson(json: string): Vector4 {
  const obj = JSON.parse(json);
  if (Array.isArray(obj)) {
    const [x, y, z, w] = obj;
    return create({ x, y, z, w });
  } else {
    return create(obj);
  }
}
