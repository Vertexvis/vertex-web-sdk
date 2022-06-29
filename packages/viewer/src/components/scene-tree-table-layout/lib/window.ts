export function restartTimeout(
  fn: VoidFunction,
  existingTimeout?: number,
  delay = 200
): number {
  window.clearTimeout(existingTimeout);
  return window.setTimeout(fn, delay);
}
