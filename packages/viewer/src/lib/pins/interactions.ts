import { Point } from '@vertexvis/geometry';
import { Disposable, UUID } from '@vertexvis/utils';

import { translatePointToRelative } from '../../components/viewer-markup/utils';
import { Cursor, labelPinCursor, pinCursor } from '../cursors';
import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import { InteractionApi, InteractionHandler } from '../interactions';
import { EntityType } from '../types/entities';
import { PinController } from './controller';
import { DefaultPin, TextPin } from './entities';

export class PinsInteractionHandler implements InteractionHandler {
  private controller: PinController;
  private element?: HTMLElement;
  private api?: InteractionApi;

  private cursor?: Disposable;

  private rectObserver = new ElementRectObserver();

  private droppableSurfaces: EntityType[] = [
    EntityType.PRECISE_SURFACE,
    EntityType.IMPRECISE_SURFACE,
    EntityType.GENERIC_GEOMETRY,
  ];

  private get elementRect(): DOMRect | undefined {
    return this.rectObserver.rect;
  }

  public constructor(controller: PinController) {
    this.controller = controller;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;
    this.rectObserver.observe(element);

    // this.setupEditMode();
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

  private getCusorType(): Cursor {
    switch (this.controller.getToolType()) {
      case 'pin':
        return pinCursor;
      case 'pin-label':
        return labelPinCursor;
    }
  }

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    if (await this.isDroppableSurface(event)) {
      this.addCursor(this.getCusorType());
    } else {
      this.clearCursor();
    }
  };

  private handlePointerDown = async (
    pointerDown: PointerEvent
  ): Promise<Disposable> => {
    const pointerUp = (pointerUp: PointerEvent): void => {
      const distnaceBetweenStartAndEndPoint = Point.distance(
        Point.create(pointerDown.clientX, pointerUp.clientY),
        Point.create(pointerUp.clientX, pointerUp.clientY)
      );

      if (distnaceBetweenStartAndEndPoint <= 2) {
        if (this.controller.getToolMode() === 'edit') {
          this.ifInitialized(async ({ api }) => {
            const pt = getMouseClientPosition(pointerDown);

            const [hit] = await api.hitItems(pt);

            if (hit?.hitPoint != null && this.elementRect != null) {
              const vector3 = await api.getWorldPointFromViewport(pt);

              const relativePoint = translatePointToRelative(
                {
                  ...pt,
                },
                this.elementRect
              );
              if (vector3 != null) {
                const pinId = UUID.create();

                switch (this.controller.getToolType()) {
                  case 'pin':
                    this.controller.addEntity(
                      new DefaultPin(pinId, vector3, pt)
                    );
                    break;
                  case 'pin-label':
                    this.controller.addEntity(
                      new TextPin(pinId, vector3, pt, {
                        labelPoint: relativePoint,
                      })
                    );
                    break;
                }
              }
            } else {
              this.controller.setSelectedPinId();
            }
          });
        }
      }
      dispose();
    };

    const dispose = (): void => {
      window.removeEventListener('pointerup', pointerUp);
    };

    window.addEventListener('pointerup', pointerUp);

    return {
      dispose,
    };
  };

  private addCursor(cursor: Cursor): void {
    this.clearCursor();
    this.cursor = this.ifInitialized(({ api }) => api.addCursor(cursor));
  }

  private async isDroppableSurface(event: PointerEvent): Promise<boolean> {
    const pt = getMouseClientPosition(event, this.elementRect);
    const type = await this.api?.getEntityTypeAtPoint(pt);

    return type != null && this.droppableSurfaces.includes(type);
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
