import { StreamApi } from '@vertexvis/stream-api';
import { Frame } from '../types';
import { Camera } from './camera';
import { Dimensions, Point } from '@vertexvis/geometry';
import { Raycaster } from './raycaster';
import { ColorMaterial, fromHex } from './colorMaterial';
import {
  SceneItemOperations,
  SceneOperationBuilder,
  ItemOperation,
} from './operations';
import { QueryExpression, SceneItemQueryExecutor } from './queries';
import { UUID } from '@vertexvis/utils';
import { buildSceneOperation } from '../commands/streamCommandsMapper';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { InvalidArgumentError } from '../errors';

interface SceneExecutionOptions {
  suppliedCorrelationId?: string;
}

/**
 * A class that is responsible for building operations for a specific scene.
 * This executor requires a query, and expects `execute()` to be invoked in order
 * for the changes to take effect.
 */
export class SceneItemOperationsBuilder
  implements SceneItemOperations<SceneItemOperationsBuilder> {
  private builder: SceneOperationBuilder;

  public constructor(
    private query: QueryExpression,
    givenBuilder?: SceneOperationBuilder
  ) {
    this.builder =
      givenBuilder != null ? givenBuilder : new SceneOperationBuilder();
  }

  public materialOverride(
    color: ColorMaterial | string
  ): SceneItemOperationsBuilder {
    if (typeof color === 'string') {
      return new SceneItemOperationsBuilder(
        this.query,
        this.builder.materialOverride(fromHex(color))
      );
    } else {
      return new SceneItemOperationsBuilder(
        this.query,
        this.builder.materialOverride(color)
      );
    }
  }

  public hide(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(this.query, this.builder.hide());
  }

  public show(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(this.query, this.builder.show());
  }

  public select(color: ColorMaterial | string): SceneItemOperationsBuilder {
    if (typeof color === 'string') {
      return new SceneItemOperationsBuilder(
        this.query,
        this.builder.select(fromHex(color))
      );
    } else {
      return new SceneItemOperationsBuilder(
        this.query,
        this.builder.select(color)
      );
    }
  }

  public deselect(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(this.query, this.builder.deselect());
  }

  public clearMaterialOverrides(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.clearMaterialOverrides()
    );
  }

  public transform(
    matrix: vertexvis.protobuf.core.IMatrix4x4f | number[]
  ): SceneItemOperationsBuilder {
    if (Array.isArray(matrix)) {
      if (matrix.length !== 16) {
        throw new InvalidArgumentError(
          'Matrix provided must contain exactly 16 values (4x4).'
        );
      }

      return new SceneItemOperationsBuilder(
        this.query,
        this.builder.transform({
          r0: {
            x: matrix[0],
            y: matrix[1],
            z: matrix[2],
            w: matrix[3],
          },
          r1: {
            x: matrix[4],
            y: matrix[5],
            z: matrix[6],
            w: matrix[7],
          },
          r2: {
            x: matrix[8],
            y: matrix[9],
            z: matrix[10],
            w: matrix[11],
          },
          r3: {
            x: matrix[12],
            y: matrix[13],
            z: matrix[14],
            w: matrix[15],
          },
        })
      );
    } else {
      return new SceneItemOperationsBuilder(
        this.query,
        this.builder.transform(matrix)
      );
    }
  }

  public build(): QueryOperation {
    return {
      query: this.query,
      operations: this.builder.build(),
    };
  }
}

export interface QueryOperation {
  query: QueryExpression;
  operations: ItemOperation[];
}

export class ItemsOperationExecutor {
  public constructor(
    private sceneViewId: UUID.UUID,
    private stream: StreamApi,
    private queryOperations: QueryOperation[]
  ) {}

  public async execute(
    executionOptions?: SceneExecutionOptions
  ): Promise<void> {
    const pbOperations = this.queryOperations.map((op) =>
      buildSceneOperation(op.query, op.operations)
    );
    const request = {
      sceneViewId: {
        hex: this.sceneViewId,
      },
      operations: pbOperations,
      suppliedCorrelationId:
        executionOptions?.suppliedCorrelationId != null
          ? {
              value: executionOptions?.suppliedCorrelationId,
            }
          : undefined,
    };

    await this.stream.createSceneAlteration(request);
  }
}

export type TerminalItemOperationBuilder =
  | SceneItemOperationsBuilder
  | SceneItemOperationsBuilder[];

export type ImageScaleProvider = () => Point.Point | undefined;

/**
 * A class that represents the `Scene` that has been loaded into the viewer. On
 * it, you can retrieve attributes of the scene, such as the camera. It also
 * contains methods for updating the scene and performing requests to rerender
 * the scene.
 */
export class Scene {
  public constructor(
    private stream: StreamApi,
    private frame: Frame.Frame,
    private imageScaleProvider: ImageScaleProvider,
    public readonly sceneViewId: UUID.UUID
  ) {}

  /**
   * Returns an executor that accepts a function as a parameter that contains one or many operations to apply
   * to the scene view. The operations will be applied transactionally.
   * @param operations
   */
  public items(
    operations: (q: SceneItemQueryExecutor) => TerminalItemOperationBuilder
  ): ItemsOperationExecutor {
    const sceneOperations = operations(new SceneItemQueryExecutor());

    const ops = Array.isArray(sceneOperations)
      ? sceneOperations
      : [sceneOperations];
    const operationList = ops.reduce(
      (acc, builder: SceneItemOperationsBuilder) => acc.concat(builder.build()),
      [] as QueryOperation[]
    );
    return new ItemsOperationExecutor(
      this.sceneViewId,
      this.stream,
      operationList
    );
  }

  /**
   * An instance of the current camera of the scene.
   */
  public camera(): Camera {
    return new Camera(
      this.stream,
      Dimensions.aspectRatio(this.viewport()),
      this.frame.sceneAttributes.camera,
      this.frame.sceneAttributes.visibleBoundingBox
    );
  }

  /**
   * Raycaster to request items that intersect a point.
   */
  public raycaster(): Raycaster {
    return new Raycaster(this.stream, this.imageScaleProvider);
  }

  /**
   * The current viewport of the scene, in pixels.
   */
  public viewport(): Dimensions.Dimensions {
    return this.frame.imageAttributes.frameDimensions;
  }

  /**
   * Applies the provided scene view state to the scene.
   */
  public async applySceneViewState(
    sceneViewStateId: UUID.UUID
  ): Promise<vertexvis.protobuf.stream.ILoadSceneViewStateResult | undefined> {
    return await this.stream.loadSceneViewState(
      {
        sceneViewStateId: { hex: sceneViewStateId },
      },
      true
    );
  }
}
