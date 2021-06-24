/**
 * Clamps the given value between `min` and `max`.
 *
 * @param value The value to clamp.
 * @param min The min possible value.
 * @param max The max possible value.
 * @returns `value` or a value clamped to `min` or `max`.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolates a value between `a` and `b` by `t`. If `t` is 0, then the
 * result will be `a`. If `t` is 1, then the result will be `b`. `t` will be
 * clamped to a value between 0 and 1.
 *
 * @param a The start value.
 * @param b The end value.
 * @param t The interpolation value between 0 and 1.
 * @returns The interpolated value between `a` and `b`.
 */
export function lerp(a: number, b: number, t: number): number {
  t = clamp(t, 0, 1);
  return t * (b - a) + a;
}
