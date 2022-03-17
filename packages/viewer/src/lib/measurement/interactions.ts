import { Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { Cursor, measurementWithArrowCursor } from '../cursors';
import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import { InteractionApi, InteractionHandler } from '../interactions';
import { EntityType } from '../types';
import { MeasurementController } from './controller';
import { MeasurementEntity } from './entities';

export class MeasurementInteractionHandler implements InteractionHandler {
  private controller: MeasurementController;
  private measurableEntityTypes: EntityType[];

  private element?: HTMLElement;
  private api?: InteractionApi;

  private cursor?: Disposable;
  private measurementInteraction?: InteractionHandler;

  private rectObserver = new ElementRectObserver();
  private get elementRect(): DOMRect | undefined {
    return this.rectObserver.rect;
  }

  public constructor(
    controller: MeasurementController,
    measurableEntityTypes: EntityType[]
  ) {
    this.controller = controller;
    this.measurableEntityTypes = measurableEntityTypes;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.rectObserver.observe(element);

    element.addEventListener('pointermove', this.handlePointerMove);
    element.addEventListener('pointerdown', this.handlePointerDown);
  }

  public dispose(): void {
    this.rectObserver.disconnect();
    this.measurementInteraction?.dispose();
    this.clearCursor();

    this.element?.removeEventListener('pointermove', this.handlePointerMove);
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);

    this.element = undefined;
    this.api = undefined;
  }

  private addCursor(cursor: Cursor): void {
    this.cursor = this.ifInitialized(({ api }) => api.addCursor(cursor));
  }

  private clearCursor(): void {
    this.cursor?.dispose();
    this.cursor = undefined;
  }

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    if (await this.isMeasurableEntityUnderPointer(event)) {
      this.clearCursor();
      this.addCursor(measurementWithArrowCursor);
    } else {
      this.clearCursor();
    }
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.ifNoInteraction(event, async () => {
      if (await this.isMeasurableEntityUnderPointer(event)) {
        this.measureEntityUnderPointer(event);
      } else {
        this.controller.clearEntities();
      }
    });
  };

  private async isMeasurableEntityUnderPointer(
    event: PointerEvent
  ): Promise<boolean> {
    const pt = getMouseClientPosition(event, this.elementRect);
    const type = await this.api?.getEntityTypeAtPoint(pt);
    console.log('type precise-measurement: ', type);
    return type != null && this.measurableEntityTypes.includes(type);
  }

  private measureEntityUnderPointer(event: PointerEvent): void {
    this.ifInitialized(async ({ api }) => {
      const pt = getMouseClientPosition(event, this.elementRect);
      const [hit] = await api.hitItems(pt);

      if (hit != null) {
        this.controller.addEntity(MeasurementEntity.fromHit(hit));
      } else {
        this.controller.clearEntities();
      }
    });
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
