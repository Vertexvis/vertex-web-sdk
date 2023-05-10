export function parseCssColorValue(
  styles: CSSStyleDeclaration,
  property: string
): string {
  return styles.getPropertyValue(property).trim().replace(/["']*/g, '');
}
