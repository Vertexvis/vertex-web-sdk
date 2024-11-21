import { Point } from '@vertexvis/geometry';
import { StreamRequestError } from '@vertexvis/stream-api';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import {
  PmiAnnotationOperationsBuilder,
  SceneItemOperationsBuilder,
  TerminalItemOperationBuilder,
} from '../scenes';
import { SceneElementQueryExecutor } from '../scenes/queries';
import { VolumeIntersectionQueryModel } from './model';

export type OperationTransform = (
  builder: SceneItemOperationsBuilder
) => TerminalItemOperationBuilder;
export type AdditionalTransform = (
  executor: SceneElementQueryExecutor
) => TerminalItemOperationBuilder;

export interface CompleteExecutionDetails {
  aborted: boolean;
}

export class VolumeIntersectionQueryController {
  private previousViewerCameraControls?: boolean;
  private operationTransform: OperationTransform;
  private additionalTransforms: AdditionalTransform[] = [];
  private operationInFlight = false;
  private operationAborted = false;

  private executeStarted = new EventDispatcher<void>();
  private executeComplete = new EventDispatcher<CompleteExecutionDetails>();
  private executeAborted = new EventDispatcher<StreamRequestError>();

  public constructor(
    private model: VolumeIntersectionQueryModel,
    private viewer: HTMLVertexViewerElement
  ) {
    this.additionalTransforms = [
      (op) => op.items.where((q) => q.all()).deselect(),
    ];
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

  /**
   * Updates the operation that will be applied based on the volume intersection
   * query. Defaults to `(builder) => builder.select()`, which will select any
   * of the results of the query.
   */
  public setOperationTransform(operationTransform: OperationTransform): void {
    this.operationTransform = operationTransform;
  }

  /**
   * Updates any additional operations that should be performed independent of
   * the volume intersection query. This can be used to perform an operation on
   * the entirety of the scene prior to the operation on the result of the
   * volume intersection query.
   * Defaults to `[(op) => op.items.where((q) => q.all()).deselect()]`, which will
   * clear any prior selection before the default selection.
   */
  public setAdditionalTransforms(
    additionalTransforms: AdditionalTransform[]
  ): void {
    this.additionalTransforms = additionalTransforms;
  }

  public onExecuteStarted(listener: Listener<void>): Disposable {
    return this.executeStarted.on(listener);
  }

  public onExecuteComplete(
    listener: Listener<CompleteExecutionDetails>
  ): Disposable {
    return this.executeComplete.on(listener);
  }

  public onExecuteAborted(listener: Listener<StreamRequestError>): Disposable {
    return this.executeAborted.on(listener);
  }

  public async execute(): Promise<void> {
    const screenBounds = this.model.getScreenBounds();
    const type = this.model.getType();

    if (screenBounds != null && !this.operationInFlight) {
      this.model.complete();

      try {
        this.operationInFlight = true;
        this.executeStarted.emit();

        const additionalTransforms = (
          op: SceneElementQueryExecutor
        ): Array<SceneItemOperationsBuilder | PmiAnnotationOperationsBuilder> =>
          this.additionalTransforms.map((t) => t(op)).flat();
        const operationTransforms = (
          op: SceneElementQueryExecutor
        ): Array<SceneItemOperationsBuilder | PmiAnnotationOperationsBuilder> =>
          [
            this.operationTransform(
              op.items.where((q) =>
                q.withVolumeIntersection(screenBounds, type === 'exclusive')
              )
            ),
          ].flat();

        const scene = await this.viewer.scene();
        await scene
          .elements((op) => [
            ...additionalTransforms(op),
            ...operationTransforms(op),
          ])
          .execute();
      } catch (e) {
        if (
          e instanceof StreamRequestError &&
          e.summary?.toLocaleLowerCase().includes('operation aborted')
        ) {
          this.executeAborted.emit(e);
          this.operationAborted = true;
        } else {
          console.error('Failed to perform volume intersection query', e);
          throw e;
        }
      } finally {
        this.viewer.cameraControls = this.previousViewerCameraControls ?? true;
        this.previousViewerCameraControls = undefined;
        this.operationInFlight = false;
        this.executeComplete.emit({
          aborted: this.operationAborted,
        });
        this.operationAborted = false;
      }
    } else if (this.operationInFlight) {
      this.model.cancel();

      throw new Error(
        `Unable to perform volume intersection query as there is already one in-flight.`
      );
    } else {
      this.model.cancel();

      this.viewer.cameraControls = this.previousViewerCameraControls ?? true;
    }
  }
}
