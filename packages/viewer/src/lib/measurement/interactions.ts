import { Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { measurementCursor } from '../cursors';
import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import { InteractionApi, InteractionHandler } from '../interactions';
import { EntityType, isPreciseEntityType } from '../types';
import { MeasurementController } from './controller';
import { PreciseMeasurementEntity } from './entities';

export class MeasurementInteractionHandler implements InteractionHandler {
  private controller: MeasurementController;
  private element?: HTMLElement;
  private api?: InteractionApi;
  private rectObserver = new ElementRectObserver();

  private entityType?: EntityType;
  private measurementInteraction?: InteractionHandler;

  public constructor(controller: MeasurementController) {
    this.controller = controller;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.rectObserver.observe(element);

    element.addEventListener('pointermove', this.handlePointerMove);
  }

  public dispose(): void {
    this.rectObserver.disconnect();
    this.measurementInteraction?.dispose();

    this.element?.removeEventListener('pointermove', this.handlePointerMove);
  }

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    if (this.rectObserver.rect != null) {
      const pt = getMouseClientPosition(event, this.rectObserver.rect);
      const type = await this.api?.getEntityTypeAtPoint(pt);

      if (this.entityType !== type) {
        if (
          type != null &&
          (this.entityType == null ||
            isPreciseEntityType(this.entityType) !== isPreciseEntityType(type))
        ) {
          this.replaceInteractionHandler(type);
        }
        this.entityType = type;
      }
    }
  };

  private replaceInteractionHandler(type: EntityType): void {
    this.measurementInteraction?.dispose();

    if (this.element == null) {
      throw new Error(
        'Cannot replace interaction handler. Element is undefined.'
      );
    }

    if (this.api == null) {
      throw new Error(
        'Cannot replace interaction handler. Interaction API is undefined.'
      );
    }

    if (isPreciseEntityType(type)) {
      this.measurementInteraction = new PreciseMeasurementInteractionHandler(
        this.controller
      );
    } else {
      this.measurementInteraction =
        new ImpreciseMeasurementInteractionHandler();
    }

    this.measurementInteraction.initialize(this.element, this.api);
  }
}

class PreciseMeasurementInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private api?: InteractionApi;
  private cursor?: Disposable;

  private rectObserver = new ElementRectObserver();

  public constructor(private readonly controller: MeasurementController) {}

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.rectObserver.observe(element);

    this.element.addEventListener('pointermove', this.handlePointerMove);
    this.element.addEventListener('pointerdown', this.handlePointerDown);
  }

  public dispose(): void {
    this.element?.removeEventListener('pointermove', this.handlePointerMove);
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);

    this.clearCursor();
    this.rectObserver.disconnect();

    this.element = undefined;
    this.api = undefined;
  }

  private clearCursor(): void {
    this.cursor?.dispose();
    this.cursor = undefined;
  }

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    if (this.rectObserver.rect != null) {
      const pt = getMouseClientPosition(event, this.rectObserver.rect);
      const type = await this.api?.getEntityTypeAtPoint(pt);

      this.clearCursor();

      if (type != null && isPreciseEntityType(type)) {
        this.cursor = this.api?.addCursor(measurementCursor);
      }
    } else {
      this.clearCursor();
    }
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.ifNoInteraction(event, () => {
      this.ifInitialized(async ({ element, api }) => {
        const pt = getMouseClientPosition(
          event,
          element.getBoundingClientRect()
        );
        const [hit] = await api.hitItems(pt);

        if (hit != null) {
          this.controller.addEntity(PreciseMeasurementEntity.fromHit(hit));
        } else {
          this.controller.clearEntities();
        }
      });
    });
  };

  private ifNoInteraction(event: PointerEvent, f: () => void): void {
    const startPos = Point.create(event.clientX, event.clientY);
    let didInteract = false;

    const handleMouseMove = (event: PointerEvent): void => {
      const pos = Point.create(event.clientX, event.clientY);
      const dis = Point.distance(startPos, pos);
      didInteract = dis > 2;
    };

    const handleMouseUp = (): void => {
      window.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('pointerup', handleMouseUp);

      if (!didInteract) {
        f();
      }
    };

    window.addEventListener('pointermove', handleMouseMove);
    window.addEventListener('pointerup', handleMouseUp);
  }

  private ifInitialized<R>(
    f: (data: { element: HTMLElement; api: InteractionApi }) => R
  ): R {
    if (this.element != null && this.api != null) {
      return f({ element: this.element, api: this.api });
    } else {
      throw new Error('Measurement interaction handler not initialized.');
    }
  }
}

class ImpreciseMeasurementInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private api?: InteractionApi;

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;
  }

  public dispose(): void {
    // noop yet
  }
}
