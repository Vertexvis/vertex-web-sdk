import { MeasurementController, MeasurementEntity } from '../..';
import { getMouseClientPosition } from '../dom';
import { InteractionApi, InteractionHandler } from '../interactions';

export class PreciseMeasurementInteractionHandler
  implements InteractionHandler
{
  private controller: MeasurementController;
  private element?: HTMLElement;
  private api?: InteractionApi;

  public constructor(controller: MeasurementController) {
    this.controller = controller;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    element.addEventListener('pointerdown', this.handlePointerDown);
  }

  public dispose(): void {
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    this.ifNoInteraction(() => {
      this.ifInitialized(async ({ element, api }) => {
        const pt = getMouseClientPosition(
          event,
          element.getBoundingClientRect()
        );
        const [hit] = await api.hitItems(pt);

        if (hit != null) {
          this.controller.addEntity(MeasurementEntity.fromHit(hit));
        } else {
          this.controller.clearEntities();
        }
      });
    });
  };

  private ifNoInteraction(f: () => void): void {
    let didInteract = false;
    function handleMouseMove(): void {
      didInteract = true;
    }

    function handleMouseUp(): void {
      window.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('pointerup', handleMouseUp);

      if (!didInteract) {
        f();
      }
    }

    window.addEventListener('pointermove', handleMouseMove);
    window.addEventListener('pointerup', handleMouseUp);
  }

  private ifInitialized<R>(
    f: (data: { element: HTMLElement; api: InteractionApi }) => R
  ): R {
    if (this.element != null && this.api != null) {
      return f({ element: this.element, api: this.api });
    } else {
      throw new Error('Measurement interaction handler not initialized');
    }
  }
}
