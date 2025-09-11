export class VisibilityObserver {
  private targetElement?: HTMLElement;

  private intersectionObserver: IntersectionObserver;
  // private mutationObserver: MutationObserver;

  public constructor(private callback: VoidFunction) {
    this.intersectionObserver = new IntersectionObserver(callback, {
      root: null,
    });
  }

  public observe(element: HTMLElement): void {
    this.targetElement = element;

    this.intersectionObserver.observe(element);
  }

  public unobserve(): void {
    if (this.targetElement != null) {
      this.intersectionObserver.unobserve(this.targetElement);
    }

    this.targetElement = undefined;
  }

  public disconnect(): void {
    this.intersectionObserver.disconnect();
  }

  public isVisible(): boolean {
    if (this.targetElement == null) {
      return false;
    }

    if ('checkVisibility' in this.targetElement) {
      return this.checkVisibility(this.targetElement);
    }

    // In the case that checkVisibility is not available for an
    // element, just return true rather than checking the entire
    // parent structure.
    return true;
  }

  private checkVisibility(element: HTMLElement): boolean {
    return element.checkVisibility({
      checkVisibilityCSS: true,
    });
  }
}
