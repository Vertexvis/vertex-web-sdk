import { Point } from '@vertexvis/geometry';

import { SceneItemOperationsBuilder } from '../scenes';
import { VolumeIntersectionQueryModel } from './model';

export type OperationTransform = (
  builder: SceneItemOperationsBuilder
) => SceneItemOperationsBuilder;

export class VolumeIntersectionQueryController {
  private previousViewerCameraControls?: boolean;
  private operationTransform: OperationTransform;

  public constructor(
    private model: VolumeIntersectionQueryModel,
    private viewer: HTMLVertexViewerElement
  ) {
    this.operationTransform = (builder) => builder.select();
  }

  public setStartPoint(point: Point.Point): void {
    this.previousViewerCameraControls = this.viewer.cameraControls;
    this.viewer.cameraControls = false;

    this.model.setStartPoint(point);
  }

  public setEndPoint(point: Point.Point): void {
    this.model.setEndPoint(point);
  }

  public setOperationTransform(
    operationTransform: (
      builder: SceneItemOperationsBuilder
    ) => SceneItemOperationsBuilder
  ): void {
    console.log('update operation transform');
    this.operationTransform = operationTransform;
  }

  public async execute(): Promise<void> {
    console.log('execute');
    const screenBounds = this.model.getScreenBounds();
    const type = this.model.getType();
    this.viewer.cameraControls = this.previousViewerCameraControls ?? true;
    this.model.complete();

    if (screenBounds != null) {
      const scene = await this.viewer.scene();
      scene
        .items((op) =>
          this.operationTransform(
            op.where((q) =>
              q.withVolumeIntersection(screenBounds, type === 'exclusive')
            )
          )
        )
        .execute();
    }
  }
}
