import { Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { Cursor, measurementCursor } from '../cursors';
import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import { InteractionApi, InteractionHandler } from '../interactions';
import { EntityType, isPreciseEntityType } from '../types';
import { ImpreciseMeasurementEntity } from '.';
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
      this.measurementInteraction = new PreciseMeasurementInteraction(
        this.controller
      );
    } else {
      this.measurementInteraction = new ImpreciseMeasurementInteraction(
        this.controller
      );
    }

    this.measurementInteraction.initialize(this.element, this.api);
  }
}

class MeasurementInteraction implements InteractionHandler {
  protected element?: HTMLElement;
  protected api?: InteractionApi;

  protected get elementRect(): DOMRect | undefined {
    return this.rectObserver.rect;
  }

  private rectObserver = new ElementRectObserver();
  private cursor?: Disposable;

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.rectObserver.observe(this.element);
  }

  public dispose(): void {
    this.rectObserver.disconnect();
    this.clearCursor();

    this.element = undefined;
    this.api = undefined;
  }

  protected addCursor(cursor: Cursor): void {
    this.cursor = this.ifInitialized(({ api }) => api.addCursor(cursor));
  }

  protected clearCursor(): void {
    this.cursor?.dispose();
    this.cursor = undefined;
  }

  protected ifInitialized<R>(
    f: (data: { element: HTMLElement; api: InteractionApi }) => R
  ): R {
    if (this.element != null && this.api != null) {
      return f({ element: this.element, api: this.api });
    } else {
      throw new Error('Measurement interaction handler not initialized.');
    }
  }

  protected ifNoInteraction(event: PointerEvent, f: () => void): void {
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
}

class PreciseMeasurementInteraction extends MeasurementInteraction {
  public constructor(private readonly controller: MeasurementController) {
    super();
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    super.initialize(element, api);

    this.element?.addEventListener('pointermove', this.handlePointerMove);
    this.element?.addEventListener('pointerdown', this.handlePointerDown);
  }

  public dispose(): void {
    this.element?.removeEventListener('pointermove', this.handlePointerMove);
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);

    this.clearCursor();

    super.dispose();
  }

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    const pt = getMouseClientPosition(event, this.elementRect);
    const type = await this.api?.getEntityTypeAtPoint(pt);

    this.clearCursor();

    if (type != null && isPreciseEntityType(type)) {
      this.addCursor(measurementCursor);
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
}

class ImpreciseMeasurementInteraction extends MeasurementInteraction {
  public constructor(private readonly controller: MeasurementController) {
    super();
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    super.initialize(element, api);

    this.element?.addEventListener('pointermove', this.handlePointerMove);
    this.element?.addEventListener('pointerdown', this.handlePointerDown);
  }

  public dispose(): void {
    this.element?.removeEventListener('pointermove', this.handlePointerMove);
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);

    super.dispose();
  }

  private handlePointerMove = (event: PointerEvent): void => {
    this.ifInitialized(async ({ api }) => {
      const pt = getMouseClientPosition(event, this.elementRect);
      const type = await api.getEntityTypeAtPoint(pt);

      this.clearCursor();

      if (type != null && !isPreciseEntityType(type)) {
        this.addCursor('crosshair');
      }
    });
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.ifNoInteraction(event, () =>
      this.ifInitialized(async ({ api }) => {
        const pt = getMouseClientPosition(event, this.elementRect);
        const type = await api.getEntityTypeAtPoint(pt);
        const worldPt = await api.getWorldPointFromViewport(pt);

        if (type != null && worldPt != null) {
          console.log('add entity', worldPt);
          this.controller.addEntity(new ImpreciseMeasurementEntity(worldPt));
        }
      })
    );
  };
}
