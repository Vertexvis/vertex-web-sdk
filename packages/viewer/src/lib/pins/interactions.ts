import { Disposable, UUID } from '@vertexvis/utils';

import { Cursor, pinCursor } from '../cursors';
import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import { InteractionApi, InteractionHandler } from '../interactions';
import { EntityType } from '../types';
import { PinController } from './controller';
import { PinEntity, TextPinEntity } from './entities';

export class PinsInteractionHandler implements InteractionHandler {
  private controller: PinController;
  private element?: HTMLElement;
  private api?: InteractionApi;

  private cursor?: Disposable;
  private VALID_GEOMETRY_TYPES: EntityType[] = [
    EntityType.CROSS_SECTION,
    EntityType.PRECISE_EDGE,
    EntityType.PRECISE_SURFACE,
    EntityType.IMPRECISE_EDGE,
    EntityType.IMPRECISE_SURFACE,
    EntityType.GENERIC_GEOMETRY,
  ];

  private rectObserver = new ElementRectObserver();

  private get elementRect(): DOMRect | undefined {
    return this.rectObserver.rect;
  }

  public constructor(controller: PinController) {
    this.controller = controller;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;
    this.addCursor('crosshair');

    element.addEventListener('pointermove', this.handlePointerMove);
    element.addEventListener('pointerdown', this.handlePointerDown);
  }

  public dispose(): void {
    this.rectObserver.disconnect();
    this.element?.removeEventListener('pointermove', this.handlePointerMove);
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);

    this.element = undefined;
    this.api = undefined;
  }

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    // if (await this.isDroppableSurface(event)) {
    //   this.addCursor(pinCursor);
    // } else {
    //   this.clearCursor();
    //   console.log('clearing cursor ');
    //   // console.log('not-droppable');
    // }
  };

  private handlePointerDown = async (event: PointerEvent): Promise<void> => {
    this.controller.setSelectedPinId(undefined);
    this.ifInitialized(async ({ api }) => {
      const pt = getMouseClientPosition(event);

      const [hit] = await api.hitItems(pt);

      if (hit?.hitPoint != null) {
        const vector3 = await api.getWorldPointFromViewport(pt);
        const labelVector = await api.getWorldPointFromViewport({
          x: pt.x,
          y: pt.y - 50,
        });

        console.log('Got vector3: ', vector3);
        if (vector3 != null) {
          const pinId = UUID.create();
          this.controller.addEntity(
            new TextPinEntity(pinId, vector3, pt, labelVector)
          );
        }
      } else {
        console.warn('No Hit Found');
      }
    });
  };

  private addCursor(cursor: Cursor): void {
    this.cursor = this.ifInitialized(({ api }) => api.addCursor(cursor));
  }

  protected ifInitialized<R>(
    f: (data: { element: HTMLElement; api: InteractionApi }) => R
  ): R {
    if (this.element != null && this.api != null) {
      return f({ element: this.element, api: this.api });
    } else {
      throw new Error('Pins interaction handler not initialized.');
    }
  }

  private clearCursor(): void {
    this.cursor?.dispose();
    this.cursor = undefined;
  }
}
