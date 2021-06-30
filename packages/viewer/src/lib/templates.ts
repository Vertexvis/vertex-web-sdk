export function stampTemplate<E extends Element>(
  template: HTMLTemplateElement
): E {
  const fragment = template.content.cloneNode(true) as HTMLElement;
  const element = fragment.firstElementChild;
  return element as E;
}

export function stampTemplateWithValidation<E extends Element>(
  template: HTMLTemplateElement,
  validation: (value: unknown) => value is E,
  errorMsg?: () => void
): E | undefined {
  const element = stampTemplate(template);
  if (validation(element)) {
    return element;
  } else {
    errorMsg?.();
  }
}

export function stampTemplateWithId<E extends Element>(
  parent: Element,
  id: string,
  validation: (value: unknown) => value is E,
  templateNotFoundErrorMsg: () => void,
  validationErrorMsg: () => void
): E | undefined {
  const template = getTemplateWithId(parent, id, templateNotFoundErrorMsg);
  if (template != null) {
    return stampTemplateWithValidation(
      template,
      validation,
      validationErrorMsg
    );
  }
}

export function getTemplateWithId(
  parent: Element,
  id: string,
  errorMsg?: () => void
): HTMLTemplateElement | undefined {
  const element = parent.querySelector(`#${id}`);

  if (element instanceof HTMLTemplateElement) {
    return element;
  } else {
    errorMsg?.();
  }
}
