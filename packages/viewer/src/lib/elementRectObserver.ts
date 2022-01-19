export class ElementRectObserver {
  private element?: HTMLElement;
  public rect?: DOMRect;

  private observer: ResizeObserver = new ResizeObserver(() => this.measure());

  public observe(element: HTMLElement): void {
    this.element = element;
    this.observer.observe(element);
    this.measure();
  }

  public disconnect(): void {
    this.element = undefined;
    this.observer.disconnect();
  }

  private measure(): void {
    this.rect = this.element?.getBoundingClientRect();
  }
}
