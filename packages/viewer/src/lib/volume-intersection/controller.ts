import { Point } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { SceneItemOperationsBuilder } from '../scenes';
import { VolumeIntersectionQueryModel } from './model';

export type OperationTransform = (
  builder: SceneItemOperationsBuilder
) => SceneItemOperationsBuilder;

export class VolumeIntersectionQueryController {
  private previousViewerCameraControls?: boolean;
  private operationTransform: OperationTransform;
  private operationInFlight = false;

  private executeStarted = new EventDispatcher<void>();
  private executeComplete = new EventDispatcher<void>();

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

  public onExecuteStarted(listener: Listener<void>): Disposable {
    return this.executeStarted.on(listener);
  }

  public onExecuteComplete(listener: Listener<void>): Disposable {
    return this.executeComplete.on(listener);
  }

  public async execute(): Promise<void> {
    const screenBounds = this.model.getScreenBounds();
    const type = this.model.getType();
    this.model.complete();

    if (screenBounds != null && !this.operationInFlight) {
      try {
        this.operationInFlight = true;
        this.executeStarted.emit();
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
        this.viewer.cameraControls = this.previousViewerCameraControls ?? true;
        this.previousViewerCameraControls = undefined;
        this.operationInFlight = false;
        this.executeComplete.emit();
      }
    } else if (this.operationInFlight) {
      throw new Error(
        `Unable to perform volume intersection query as there is already one in-flight.`
      );
    } else {
      throw new Error(
        `Unable to perform volume intersection query. No screen bounds have been drawn.`
      );
    }
  }
}
