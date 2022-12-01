import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { BoundingBox, Dimensions, Point } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { InvalidArgumentError, InvalidCameraError } from '../errors';
import { FrameDecoder } from '../mappers';
import { SceneViewStateIdentifier } from '../types';
import { Frame } from '../types/frame';
import { Camera, OrthographicCamera, PerspectiveCamera } from '.';
import { ColorMaterial, fromHex } from './colorMaterial';
import { CrossSectioner } from './crossSectioner';
import {
  buildSceneOperation,
  buildSceneViewStateIdentifier,
  toPbSceneViewStateFeatures,
} from './mapper';
import {
  ItemOperation,
  SceneItemOperations,
  SceneOperationBuilder,
} from './operations';
import { QueryExpression, SceneItemQueryExecutor } from './queries';
import { Raycaster } from './raycaster';

interface SceneExecutionOptions {
  suppliedCorrelationId?: string;
}

interface ResetViewOptions {
  includeCamera?: boolean;
  suppliedCorrelationId?: string;
}

/**
 * A class that is responsible for building operations for a specific scene.
 * This executor requires a query, and expects `execute()` to be invoked in order
 * for the changes to take effect.
 */
export class SceneItemOperationsBuilder
  implements SceneItemOperations<SceneItemOperationsBuilder>
{
  private builder: SceneOperationBuilder;

  public constructor(
    private query: QueryExpression,
    private defaultSelectionMaterial: ColorMaterial,
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
        this.defaultSelectionMaterial,
        this.builder.materialOverride(fromHex(color))
      );
    } else {
      return new SceneItemOperationsBuilder(
        this.query,
        this.defaultSelectionMaterial,
        this.builder.materialOverride(color)
      );
    }
  }

  public hide(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.defaultSelectionMaterial,
      this.builder.hide()
    );
  }

  public show(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.defaultSelectionMaterial,
      this.builder.show()
    );
  }

  public select(
    colorOrMaterial?: ColorMaterial | string
  ): SceneItemOperationsBuilder {
    if (typeof colorOrMaterial === 'string') {
      return new SceneItemOperationsBuilder(
        this.query,
        this.defaultSelectionMaterial,
        this.builder.select(fromHex(colorOrMaterial))
      );
    } else {
      return new SceneItemOperationsBuilder(
        this.query,
        this.defaultSelectionMaterial,
        this.builder.select(colorOrMaterial || this.defaultSelectionMaterial)
      );
    }
  }

  public deselect(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.defaultSelectionMaterial,
      this.builder.deselect()
    );
  }

  public clearMaterialOverrides(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.defaultSelectionMaterial,
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
        this.defaultSelectionMaterial,
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
        this.defaultSelectionMaterial,
        this.builder.transform(matrix)
      );
    }
  }

  public clearTransforms(cascade = true): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.defaultSelectionMaterial,
      this.builder.clearTransforms(cascade)
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
    private dimensions: Dimensions.Dimensions,
    private queryOperations: QueryOperation[]
  ) {}

  public async execute(
    executionOptions?: SceneExecutionOptions
  ): Promise<void> {
    const pbOperations = this.queryOperations.map((op) =>
      buildSceneOperation(op.query, op.operations, {
        dimensions: this.dimensions,
      })
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
 * The features of a scene view state that can be applied to the current scene
 */
export type SceneViewStateFeature =
  | 'camera'
  | 'cross_section'
  | 'material_overrides'
  | 'selection'
  | 'transforms'
  | 'visibility';

/**
 * A class that represents the `Scene` that has been loaded into the viewer. On
 * it, you can retrieve attributes of the scene, such as the camera. It also
 * contains methods for updating the scene and performing requests to rerender
 * the scene.
 */
export class Scene {
  public constructor(
    private stream: StreamApi,
    private frame: Frame,
    private decodeFrame: FrameDecoder,
    private imageScaleProvider: ImageScaleProvider,
    private dimensions: Dimensions.Dimensions,
    public readonly sceneId: UUID.UUID,
    public readonly sceneViewId: UUID.UUID,
    private defaultSelectionMaterial: ColorMaterial
  ) {}

  /**
   * Applies the provided scene view state to the scene.
   */
  public async applySceneViewState(
    sceneViewStateId:
      | UUID.UUID
      | SceneViewStateIdentifier.SceneViewStateIdentifier,
    opts: SceneExecutionOptions = {}
  ): Promise<vertexvis.protobuf.stream.ILoadSceneViewStateResult | undefined> {
    const pbIdField = buildSceneViewStateIdentifier(sceneViewStateId);

    return await this.stream.loadSceneViewState(
      {
        ...pbIdField,
        frameCorrelationId: opts.suppliedCorrelationId
          ? { value: opts.suppliedCorrelationId }
          : undefined,
      },
      true
    );
  }

  /**
   * Applies the specified features of the provided scene view state to the scene.
   */
  public async applyPartialSceneViewState(
    sceneViewStateId:
      | UUID.UUID
      | SceneViewStateIdentifier.SceneViewStateIdentifier,
    featuresToApply: SceneViewStateFeature[],
    opts: SceneExecutionOptions = {}
  ): Promise<vertexvis.protobuf.stream.ILoadSceneViewStateResult | undefined> {
    const pbIdField = buildSceneViewStateIdentifier(sceneViewStateId);
    const pbFeatures = toPbSceneViewStateFeatures(featuresToApply);

    return await this.stream.loadSceneViewState(
      {
        ...pbIdField,
        frameCorrelationId: opts.suppliedCorrelationId
          ? { value: opts.suppliedCorrelationId }
          : undefined,
        sceneViewStateFeatureSubset: pbFeatures,
      },
      true
    );
  }

  /**
   * Resets the view to its default state, with the ability to reset the camera to that of the base scene.
   */
  public async reset(
    opts: ResetViewOptions = {}
  ): Promise<vertexvis.protobuf.stream.IResetViewResult | undefined> {
    return await this.stream.resetSceneView(
      {
        includeCamera: opts.includeCamera,
        frameCorrelationId: opts.suppliedCorrelationId
          ? { value: opts.suppliedCorrelationId }
          : undefined,
      },
      true
    );
  }

  /**
   * Returns an executor that accepts a function as a parameter that contains one or many operations to apply
   * to the scene view. The operations will be applied transactionally.
   * @param operations
   */
  public items(
    operations: (q: SceneItemQueryExecutor) => TerminalItemOperationBuilder
  ): ItemsOperationExecutor {
    const sceneOperations = operations(
      new SceneItemQueryExecutor(this.defaultSelectionMaterial)
    );

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
      this.dimensions,
      operationList
    );
  }

  /**
   * An instance of the current camera of the scene.
   */
  public camera(): Camera {
    const { scene } = this.frame;

    if (scene.camera.isOrthographic()) {
      return new OrthographicCamera(
        this.stream,
        Dimensions.aspectRatio(this.viewport()),
        {
          viewVector: scene.camera.viewVector,
          lookAt: scene.camera.lookAt,
          up: scene.camera.up,
          fovHeight: scene.camera.fovHeight,
        },
        this.frame.scene.boundingBox,
        this.decodeFrame
      );
    } else if (scene.camera.isPerspective()) {
      return new PerspectiveCamera(
        this.stream,
        Dimensions.aspectRatio(this.viewport()),
        {
          position: scene.camera.position,
          lookAt: scene.camera.lookAt,
          up: scene.camera.up,
          fovY: scene.camera.fovY,
        },
        this.frame.scene.boundingBox,
        this.decodeFrame
      );
    } else {
      throw new InvalidCameraError(
        'Cannot retrieve camera. Scene has an unknown or invalid camera type.'
      );
    }
  }

  public boundingBox(): BoundingBox.BoundingBox {
    return this.frame.scene.boundingBox;
  }

  /**
   * CrossSectioner to update cross sectioning planes and get current configuration.
   */
  public crossSectioning(): CrossSectioner {
    return new CrossSectioner(this.stream, this.frame.scene.crossSection);
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
    return this.frame.dimensions;
  }

  /**
   * The current x and y scale of the rendered image.
   */
  public scale(): Point.Point {
    return this.imageScaleProvider() || Point.create(1, 1);
  }
}
