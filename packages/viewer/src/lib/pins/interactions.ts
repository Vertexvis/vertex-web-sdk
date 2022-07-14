import { Point, Vector3 } from '@vertexvis/geometry';
import { Disposable, UUID } from '@vertexvis/utils';

import { translatePointToRelative } from '../../components/viewer-markup/utils';
import { Cursor, labelPinCursor, pinCursor } from '../cursors';
import { getMouseClientPosition } from '../dom';
import { ElementRectObserver } from '../elementRectObserver';
import { InteractionApi, InteractionHandler } from '../interactions';
import { EntityType } from '../types/entities';
import { Draggable, PinController } from './controller';
import { Pin } from './model';

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

    element.addEventListener('pointermove', this.handlePointerMove);
    element.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  public dispose(): void {
    this.rectObserver.disconnect();

    this.element?.removeEventListener('pointermove', this.handlePointerMove);
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);

    this.element = undefined;
    this.api = undefined;
  }

  public async getWorldPositionForPoint(
    pt: Point.Point
  ): Promise<Vector3.Vector3 | undefined> {
    return this.ifInitialized(async ({ api }) => {
      const vector3 = await api.getWorldPointFromViewport(pt);

      return vector3;
    });
  }

  public async handlePlacePin(
    pt: Point.Point,
    existingPin?: Pin
  ): Promise<void> {
    this.ifInitialized(async ({ api }) => {
      const [hit] = await api.hitItems(pt);

      if (hit?.hitPoint != null && this.elementRect != null) {
        const relativePoint = translatePointToRelative(pt, this.elementRect);
        if (
          hit?.hitPoint != null &&
          hit?.hitPoint.x != null &&
          hit?.hitPoint.y != null &&
          hit?.hitPoint.z != null
        ) {
          const pinId = existingPin != null ? existingPin.id : UUID.create();

          const getAttributes = (): any => {
            const mod = this.controller?.getPinsSize() % 3;

            if (mod === 0) {
              return {};
            } else if (mod === 1) {
              return {
                primaryColor: '#367C2B',
                accentColor: '#b3f0b3',
              };
            } else if (mod === 2) {
              return {
                primaryColor: '#ff2',
                accentColor: '#fab',
              };
            }
          };

          switch (this.controller.getToolType()) {
            case 'pin-icon':
              this.controller.setPin({
                type: 'icon',
                id: pinId,
                worldPosition: {
                  x: hit?.hitPoint?.x,
                  y: hit?.hitPoint.y,
                  z: hit?.hitPoint.z,
                },
                partId: hit?.itemId?.hex ?? undefined,
                attributes: {
                  style: getAttributes(),
                },
              });
              break;
            case 'pin-text':
              this.controller.setPin({
                type: 'text',
                id: pinId,
                worldPosition: {
                  x: hit?.hitPoint?.x,
                  y: hit?.hitPoint.y,
                  z: hit?.hitPoint.z,
                },
                partId: hit?.itemId?.hex ?? undefined,
                label: {
                  point: relativePoint,
                },
                attributes: {
                  style: getAttributes(),
                },
              });
              break;
          }
        }
      } else {
        this.controller.setSelectedPinId();
      }
    });
  }

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    const isDroppableSurface = await this.isDroppableSurface(event);
    const draggable = this.controller.getDraggable();
    if (draggable != null && isDroppableSurface) {
      this.handleDrag(draggable, event);
    }

    if (
      this.controller.getDraggable() == null &&
      this.controller.getToolMode() === 'edit' &&
      isDroppableSurface
    ) {
      this.addCursor(this.getCusorType());
    } else {
      this.clearCursor();
    }
  };

  private getCusorType(): Cursor {
    switch (this.controller.getToolType()) {
      case 'pin-icon':
        return pinCursor;
      case 'pin-text':
        return labelPinCursor;
    }
  }

  private handleDrag = async (
    draggable: Draggable,
    event: PointerEvent
  ): Promise<void> => {
    const pt = getMouseClientPosition(event, this.elementRect);
    const worldPosition = await this.getWorldPositionForPoint(pt);

    if (worldPosition != null) {
      this.controller.updateDraggable(
        {
          ...draggable,
          lastPoint: pt,
        },
        worldPosition
      );
    }
  };

  private handlePointerDown = async (
    pointerDown: PointerEvent
  ): Promise<Disposable> => {
    const pointerUp = (pointerUp: PointerEvent): void => {
      const distanceBetweenStartAndEndPoint = Point.distance(
        Point.create(pointerDown.clientX, pointerUp.clientY),
        Point.create(pointerUp.clientX, pointerUp.clientY)
      );

      if (distanceBetweenStartAndEndPoint <= 2 && pointerDown.buttons !== 2) {
        if (this.controller.getToolMode() === 'edit') {
          const pt = getMouseClientPosition(pointerDown, this.elementRect);

          this.handlePlacePin(pt);
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

  private handlePointerUp = async (): Promise<void> => {
    const draggable = this.controller.getDraggable();
    const lastPoint = draggable?.lastPoint;

    this.controller.setDraggable(undefined);

    if (lastPoint != null && draggable != null) {
      this.ifInitialized(async ({ api }) => {
        const [hit] = await api.hitItems(lastPoint);

        if (
          hit?.hitPoint != null &&
          hit?.hitPoint?.x != null &&
          hit?.hitPoint?.y != null &&
          hit?.hitPoint?.z != null
        ) {
          this.controller.updateDraggable(
            {
              ...draggable,
              lastPoint,
            },
            {
              x: hit?.hitPoint?.x,
              y: hit?.hitPoint.y,
              z: hit?.hitPoint.z,
            },
            hit?.partId?.hex ?? undefined
          );
        }
      });
    }
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
