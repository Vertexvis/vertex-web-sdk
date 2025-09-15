// Manual definition for the Element `checkVisibility` API.
// https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility#visibilityproperty
// TODO: Remove this after upgrading StencilJS + TypeScript
declare global {
  interface Element {
    checkVisibility: (options: {
      checkOpacity?: boolean;
      checkVisibilityCSS?: boolean;
      contentVisibilityAuto?: boolean;
      opacityProperty?: boolean;
      visibilityProperty?: boolean;
    }) => boolean;
  }
}

export const DEFAULT_VISIBILITY_POLLING_INTERVAL_MS = 10000;

export class VisibilityObserver {
  private targetElement?: HTMLElement;

  private intersectionObserver: IntersectionObserver;
  private mutationObservers: MutationObserver[];

  private timeout?: number;

  public constructor(
    private callback: (visible: boolean) => void | Promise<void>
  ) {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.emitVisibilityChange = this.emitVisibilityChange.bind(this);

    this.intersectionObserver = new IntersectionObserver(
      this.handleVisibilityChange,
      {
        root: null,
        threshold: 0,
        rootMargin: '0px',
      }
    );
    this.mutationObservers = [];
  }

  public isVisible(element: HTMLElement): boolean {
    if ('checkVisibility' in element) {
      return element.checkVisibility({
        visibilityProperty: true,
        opacityProperty: true,
      });
    }

    // In the case that checkVisibility is not available for an
    // element, just return true rather than checking the entire
    // parent structure.
    return true;
  }

  public observe(element: HTMLElement): void {
    this.targetElement = element;

    this.intersectionObserver.observe(element);
    this.watchElementVisibility(element);
  }

  public unobserve(): void {
    if (this.targetElement != null) {
      this.intersectionObserver.unobserve(this.targetElement);
      this.mutationObservers.forEach((obs) => obs.disconnect());
      this.mutationObservers = [];
    }

    this.targetElement = undefined;
  }

  public disconnect(): void {
    this.intersectionObserver.disconnect();
    this.mutationObservers.forEach((obs) => obs.disconnect());
    this.mutationObservers = [];

    // this.stopVisibilityTimer();
  }

  private watchElementVisibility(element: HTMLElement | null): void {
    if (element != null) {
      const observer = new MutationObserver(this.handleVisibilityChange);
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden'],
      });

      this.mutationObservers = [...this.mutationObservers, observer];
      this.watchElementVisibility(element.parentElement);
    }
  }

  private handleVisibilityChange(): void {
    if (this.targetElement != null) {
      this.emitVisibilityChange(this.targetElement);
    }
  }

  // private restartVisibilityTimer(): void {
  //   if (this.timeout != null) {
  //     this.stopVisibilityTimer();
  //   }

  //   this.startVisibilityTimer();
  // }

  // private startVisibilityTimer(): void {
  //   this.timeout = window.setTimeout(
  //     () => this.emitVisibilityChange(this.targetElement),
  //     DEFAULT_VISIBILITY_POLLING_INTERVAL_MS
  //   );
  // }

  // private stopVisibilityTimer(): void {
  //   if (this.timeout != null) {
  //     clearTimeout(this.timeout);
  //   }

  //   this.timeout = undefined;
  // }

  private emitVisibilityChange(element?: HTMLElement): void {
    const visible = element != null ? this.isVisible(element) : true;

    // if (visible) {
    //   this.stopVisibilityTimer();
    // } else {
    //   this.restartVisibilityTimer();
    // }

    console.log(`Detected visibility change [visible={${visible}}]`);

    this.callback(visible);
  }
}
