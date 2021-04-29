export function getSceneTreeRowRootContainsElement(
  el: HTMLElement | undefined,
  other: HTMLElement
): boolean {
  return el?.contains(other) === true;
}

export function getSceneTreeRowExpandContainsElement(
  el: HTMLElement | undefined,
  other: HTMLElement
): boolean {
  return el?.contains(other) === true;
}

export function getSceneTreeRowVisibilityContainsElement(
  el: HTMLElement | undefined,
  other: HTMLElement
): boolean {
  return el?.contains(other) === true;
}
