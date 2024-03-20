export function focusInputElement(element: HTMLInputElement): void {
  if (window.document.activeElement !== element) {
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }
}
