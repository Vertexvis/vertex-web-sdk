import { Point } from '@vertexvis/geometry';

import { InteractionApi } from '../../lib/interactions';
import { InteractionHandler } from '../../lib/interactions/interactionHandler';
import { ViewerDragSelectModel } from './model';

export class ViewerDragSelectInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private api?: InteractionApi;

  public constructor(
    private viewer: HTMLVertexViewerElement,
    private dragSelectModel: ViewerDragSelectModel
  ) {
    this.handleDragBegin = this.handleDragBegin.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.element.addEventListener('pointerdown', this.handleDragBegin);
  }

  public dispose(): void {
    this.element?.removeEventListener('pointerdown', this.handleDragBegin);
    this.element?.removeEventListener('pointermove', this.handleDrag);
    this.element?.removeEventListener('pointerup', this.handleDragEnd);
  }

  private handleDragBegin(event: PointerEvent): void {
    if (event.buttons === 1) {
      this.viewer.cameraControls = false;

      this.dragSelectModel.updateStartPoint(
        Point.create(event.offsetX, event.offsetY)
      );

      this.element?.addEventListener('pointermove', this.handleDrag);
      this.element?.addEventListener('pointerup', this.handleDragEnd);
    }
  }

  private handleDrag(event: PointerEvent): void {
    this.dragSelectModel.updateEndPoint(
      Point.create(event.offsetX, event.offsetY)
    );
  }

  private handleDragEnd(): void {
    this.viewer.cameraControls = true;

    this.dragSelectModel.clear();

    this.element?.removeEventListener('pointermove', this.handleDrag);
    this.element?.removeEventListener('pointerup', this.handleDragEnd);
  }
}
