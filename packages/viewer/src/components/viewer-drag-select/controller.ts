import { Disposable } from '@vertexvis/utils';

import { DragFinishedEvent, ViewerDragSelectModel } from './model';

export class ViewerDragSelectController {
  private dragEndDisposable?: Disposable;

  public constructor(
    private viewer: HTMLVertexViewerElement,
    private model: ViewerDragSelectModel
  ) {
    this.dragEndDisposable = this.model.onDragFinished(this.selectFromBounds);
  }

  public dispose(): void {
    this.dragEndDisposable?.dispose();
  }

  public async selectFromBounds(event: DragFinishedEvent): Promise<void> {
    const scene = await this.viewer.scene();

    await scene
      .items((op) =>
        op.where((q) => q.withVolumeIntersection(event.rectangle)).select()
      )
      .execute();
  }
}
