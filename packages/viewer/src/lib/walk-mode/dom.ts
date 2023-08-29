export function targetIsElement(target: EventTarget | null): target is Element {
  return target instanceof Element;
}
