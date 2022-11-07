import { Point } from '@vertexvis/geometry';

import { SceneItemOperationsBuilder } from '../scenes';
import { VolumeIntersectionQueryModel } from './model';

export const DEFAULT_CONCURRENT_VOLUME_QUERY_LIMIT = 5;

export type OperationTransform = (
  builder: SceneItemOperationsBuilder
) => SceneItemOperationsBuilder;

export class VolumeIntersectionQueryController {
  private previousViewerCameraControls?: boolean;
  private operationTransform: OperationTransform;
  private inFlightOperations = 0;

  public constructor(
    private model: VolumeIntersectionQueryModel,
    private viewer: HTMLVertexViewerElement,
    private maxInFlightOperations = DEFAULT_CONCURRENT_VOLUME_QUERY_LIMIT
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

    if (
      screenBounds != null &&
      this.inFlightOperations < this.maxInFlightOperations
    ) {
      this.inFlightOperations = this.inFlightOperations + 1;
      try {
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
        this.inFlightOperations = this.inFlightOperations - 1;
      }
    } else if (this.inFlightOperations >= this.maxInFlightOperations) {
      throw new Error(
        `Unable to perform volume intersection query due to the limit of ${this.maxInFlightOperations}.`
      );
    }
  }
}
