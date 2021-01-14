import { StreamApi } from '@vertexvis/stream-api';
import { Frame } from '../types';
import { Camera } from './camera';
import { Dimensions } from '@vertexvis/geometry';
import { Raycaster } from './raycaster';
import { ColorMaterial, fromHex } from './colorMaterial';
import {
  SceneItemOperations,
  SceneOperationBuilder,
  ItemOperation,
} from './operations';
import { QueryExpression, SceneItemQueryExecutor } from './queries';
import { UUID } from '@vertexvis/utils';
import { RemoteRenderer } from '../rendering';
import { buildSceneOperation } from '../commands/streamCommandsMapper';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

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

  public clearMaterialOverrides(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.clearMaterialOverrides()
    );
  }

  public transform(
    matrix: vertexvis.protobuf.core.Matrix4x4f
  ): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.transform(matrix)
    );
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

  public async execute(): Promise<void> {
    const pbOperations = this.queryOperations.map(op =>
      buildSceneOperation(op.query, op.operations)
    );
    const request = {
      sceneViewId: {
        hex: this.sceneViewId,
      },
      operations: pbOperations,
    };
    console.log(request);
    console.log(this.queryOperations);
    console.log(pbOperations);
    await this.stream.createSceneAlteration(request);
  }
}

export type TerminalItemOperationBuilder =
  | SceneItemOperationsBuilder
  | SceneItemOperationsBuilder[];

/**
 * A class that represents the `Scene` that has been loaded into the viewer. On
 * it, you can retrieve attributes of the scene, such as the camera. It also
 * contains methods for updating the scene and performing requests to rerender
 * the scene.
 */
export class Scene {
  public constructor(
    private stream: StreamApi,
    private renderer: RemoteRenderer,
    private frame: Frame.Frame,
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
      this.renderer,
      Dimensions.aspectRatio(this.viewport()),
      this.frame.sceneAttributes.camera
    );
  }

  /**
   * Raycaster to request items that intersect a point.
   */
  public raycaster(): Raycaster {
    return new Raycaster(this.stream);
  }

  /**
   * The current viewport of the scene, in pixels.
   */
  public viewport(): Dimensions.Dimensions {
    return this.frame.imageAttributes.frameDimensions;
  }
}
