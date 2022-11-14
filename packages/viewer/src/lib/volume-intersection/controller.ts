import { Point } from '@vertexvis/geometry';

import { SceneItemOperationsBuilder } from '../scenes';
import { VolumeIntersectionQueryModel } from './model';

export type OperationTransform = (
  builder: SceneItemOperationsBuilder
) => SceneItemOperationsBuilder;

export class VolumeIntersectionQueryController {
  private previousViewerCameraControls?: boolean;
  private operationTransform: OperationTransform;
  private operationInFlight = false;

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
    this.operationTransform = operationTransform;
  }

  public async execute(): Promise<void> {
    const screenBounds = this.model.getScreenBounds();
    const type = this.model.getType();
    this.viewer.cameraControls = this.previousViewerCameraControls ?? true;
    this.model.complete();

    if (screenBounds != null && !this.operationInFlight) {
      try {
        this.operationInFlight = true;
        const scene = await this.viewer.scene();
        await scene
          .items((op) =>
            this.operationTransform(
              op.where((q) =>
                q.withVolumeIntersection(screenBounds, type === 'exclusive')
              )
            )
          )
          .execute();
      } catch (e) {
        console.error('Failed to perform volume intersection query', e);
        throw e;
      } finally {
        this.operationInFlight = false;
      }
    } else if (this.operationInFlight) {
      throw new Error(
        `Unable to perform volume intersection query as there is already one in-flight.`
      );
    }
  }
}
