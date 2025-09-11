import { Binding, BindingDataMap } from './binding';
import { InstancedTemplate } from './templates';

export type ElementFactory = () => InstancedTemplate<HTMLElement>;

export class ElementPool {
  private readonly elements: HTMLElement[];
  private instanceMap = new Map<HTMLElement, InstancedTemplate<HTMLElement>>();

  public constructor(
    private container: Element,
    private elementFactory: ElementFactory
  ) {
    this.elements = [];
  }

  public swapHeadToTail(count: number): HTMLElement[] {
    const sliced = this.elements.splice(0, count);
    this.elements.splice(this.elements.length, 0, ...sliced);
    return this.elements.concat();
  }

  public swapTailToHead(count: number): HTMLElement[] {
    const sliced = this.elements.splice(-count, count);
    this.elements.splice(0, 0, ...sliced);
    return this.elements.concat();
  }

  public updateElements(count: number): HTMLElement[] {
    const diff = count - this.elements.length;

    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        this.createElement();
      }
    } else {
      for (let i = 0; i < -diff; i++) {
        this.deleteElement();
      }
    }

    return this.elements.concat();
  }

  public updateData<D extends BindingDataMap>(f: (index: number) => D): void {
    this.elements.forEach((el, i) => {
      const instance = this.instanceMap.get(el);
      const data = f(i);
      instance?.bindings.bind(data);
    });
  }

  public updateElementFactory(elementFactory: ElementFactory): void {
    this.elementFactory = elementFactory;
    this.updateElements(0);
  }

  public iterateElements(
    f: (element: HTMLElement, binding: Binding, index: number) => void
  ): void {
    this.elements.forEach((el, i) => {
      const instance = this.instanceMap.get(el);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      f(el, instance!.bindings, i);
    });
  }

  private createElement(): InstancedTemplate<HTMLElement> {
    const instance = this.elementFactory();
    this.elements.push(instance.element);
    this.instanceMap.set(instance.element, instance);
    this.container.append(instance.element);
    return instance;
  }

  private deleteElement(): void {
    const element = this.elements.pop();
    if (element != null) {
      this.instanceMap.delete(element);
      element.remove();
    }
  }
}
