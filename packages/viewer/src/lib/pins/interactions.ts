import { Disposable, UUID } from '@vertexvis/utils';

import { translatePointToRelative } from '../../components/viewer-markup/utils';
import { Cursor, labelPinCursor, pinCursor } from '../cursors';
import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import { InteractionApi, InteractionHandler } from '../interactions';
import { PinController } from './controller';
import { PinEntity, TextPinEntity } from './entities';

export class PinsInteractionHandler implements InteractionHandler {
  private controller: PinController;
  private element?: HTMLElement;
  private api?: InteractionApi;

  private cursor?: Disposable;

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
    this.rectObserver.observe(element);

    this.setupEditMode();
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

  public setupEditMode(): void {
    if (this.controller.getToolMode() === 'edit') {
      switch (this.controller.getToolType()) {
        case 'pin':
          this.addCursor(pinCursor);
          break;
        case 'pin-label':
          this.addCursor(labelPinCursor);
          break;
      }
    }
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
    if (this.controller.getToolMode() === 'edit') {
      this.ifInitialized(async ({ api }) => {
        const pt = getMouseClientPosition(event);

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
                this.controller.addEntity(new PinEntity(pinId, vector3, pt));
                break;
              case 'pin-label':
                this.controller.addEntity(
                  new TextPinEntity(
                    pinId,
                    vector3,
                    pt,
                    relativePoint,
                    'Untitled Pin'
                  )
                );
                break;
            }
          }
        } else {
          this.controller.setSelectedPinId();
        }
      });
    }
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
