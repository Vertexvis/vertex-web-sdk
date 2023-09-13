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

export interface SceneExecutionOptions {
  suppliedCorrelationId?: string;
}

export interface ResetViewOptions {
  includeCamera?: boolean;
  suppliedCorrelationId?: string;
}

/**
 * A class that is responsible for building operations for a specific scene.
 * This executor requires a query, and expects `execute()` to be invoked in
 * order for the changes to take effect.
 */
export class SceneItemOperationsBuilder
  implements SceneItemOperations<SceneItemOperationsBuilder>
{
  private builder: SceneOperationBuilder;

  public constructor(
    private query: QueryExpression,
    givenBuilder?: SceneOperationBuilder
  ) {
    this.builder =
      givenBuilder != null ? givenBuilder : new SceneOperationBuilder();
  }

  /**
   * Specifies that the items matching the query should have their default
   * material overridden to match the specified material.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Override the material for the item with the `item-uuid` ID to
   * // be red with an opacity of 0.5.
   * await scene.items((op) => [
   *   op
   *     .where((q) => q.withItemId('item-uuid'))
   *     .materialOverride(ColorMaterial.create(255, 0, 0, 0.5)),
   * ]);
   *
   * // Override the material for the item with the `item-uuid` ID to
   * // be red with an opacity of 1.
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).materialOverride('#ff0000'),
   * ]).execute();
   * ```
   */
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

  /**
   * Specifies that the items matching the query should be hidden.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide the item with the `item-uuid` ID
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).hide(),
   * ]).execute();
   * ```
   */
  public hide(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(this.query, this.builder.hide());
  }

  /**
   * Specifies that the items matching the query should be shown.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Show the item with the `item-uuid` ID
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).show(),
   * ]).execute();
   * ```
   */
  public show(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(this.query, this.builder.show());
  }

  /**
   * Specifies that the items matching the query should be selected.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Select the item with the `item-uuid` ID
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).select(),
   * ]).execute();
   * ```
   */
  public select(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(this.query, this.builder.select());
  }

  /**
   * Specifies that the items matching the query should be deselected.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Deselect the item with the `item-uuid` ID
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).deselect(),
   * ]).execute();
   * ```
   */
  public deselect(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(this.query, this.builder.deselect());
  }

  /**
   * Specifies that the items matching the query should have any overridden
   * material removed.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Clear the overridden material on the item with the `item-uuid` ID
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).clearMaterialOverrides(),
   * ]);
   * ```
   */
  public clearMaterialOverrides(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.clearMaterialOverrides()
    );
  }

  /**
   * Specifies that the items matching the query should have their
   * transformation matrix overridden to match the specified transformation
   * matrix.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Override the transformation matrix for the item with the `item-uuid` ID to
   * // move the element along the x-axis
   * await scene.items((op) => [
   *   op
   *     .where((q) => q.withItemId('item-uuid'))
   *     .transform(Matrix4.makeTranslation(Vector3.create(100, 0, 0))),
   * ]);
   * ```
   */
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

  /**
   * Specifies that the items matching the query should have their overridden
   * transformation matrix removed. The `cascade` flag determines whether
   * children of the items matching the query should also have their overridden
   * transformation matrix removed, and defaults to `true`.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Clear the overridden the transformation matrix for the item with the `item-uuid` ID
   * // and do not cascade to preserve transformations on children
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).clearTransforms(false),
   * ]);
   *
   * // Clear the overridden the transformation matrix for the item with the `item-uuid` ID
   * // and cascade to clear overridden transformations on children
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).clearTransforms(true),
   * ]);
   * ```
   */
  public clearTransforms(cascade = true): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.clearTransforms(cascade)
    );
  }

  /**
   * Specifies that the items matching the query should have their phantom state
   * overridden to match the specified `phantomState` flag. If the
   * `phantomState` flag is not provided, it will default to `true`.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Mark the item with the `item-uuid` ID as phantom
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).setPhantom(true),
   * ]);
   *
   * // Unmark the item with the `item-uuid` ID as phantom
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).setPhantom(false),
   * ]);
   * ```
   */
  public setPhantom(phantomState?: boolean): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.setPhantom(phantomState)
    );
  }

  /**
   * Specifies that the items matching the query should have their overridden
   * phantom state removed.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Clear the overridden phantom state of the item with the `item-uuid` ID
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).clearPhantom(),
   * ]);
   * ```
   */
  public clearPhantom(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.clearPhantom()
    );
  }

  /**
   * Specifies that the items matching the query should have their end item
   * state overridden to match the specified `endItemState` flag. If the
   * `endItemState` flag is not provided, it will default to `true`.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Mark the item with the `item-uuid` ID as an end item
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).setEndItem(true),
   * ]);
   *
   * // Unmark the item with the `item-uuid` ID as an end item
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).setEndItem(false),
   * ]);
   * ```
   *
   * @remarks
   * End item states do not propagate to children similar to other states like
   * other operations. I.e. calling setEndItem(false) on an item will cause it
   * to be unmarked as an end item, but any children where setEndItem(true) was
   * called previously will remain as end items.
   */
  public setEndItem(endItemState?: boolean): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.setEndItem(endItemState)
    );
  }

  /**
   * Specifies that the items matching the query should have their overridden
   * end item state removed.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Clear the overridden end item state of the item with the `item-uuid` ID
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).clearEndItem(),
   * ]);
   * ```
   */
  public clearEndItem(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.clearEndItem()
    );
  }

  /**
   * Changes the rendition of an item matching the query. This operation only
   * applies to items that reference a revision that contains the given
   * rendition.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Switch the rendition of the matching item.
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).viewRenditionById('rendition-uuid'),
   * ]);
   * ```
   */
  public viewRenditionById(id: UUID.UUID): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.viewRenditionById(id)
    );
  }

  /**
   * Changes the rendition of any item matching the query that contains a
   * rendition with the given supplied ID. This operation only applies to items
   * that reference a revision that contain a rendition with a matching supplied
   * ID.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Switch the rendition of the given item.
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).viewRenditionBySuppliedId('rendition-supplied-id'),
   * ]);
   * ```
   */
  public viewRenditionBySuppliedId(
    suppliedId: string
  ): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.viewRenditionBySuppliedId(suppliedId)
    );
  }

  /**
   * Changes the rendition of items matching the query back to their revision's
   * default rendition. This operation only applies to items that reference a
   * revision.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Switch the rendition of the given item.
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).viewDefaultRendition(),
   * ]);
   * ```
   */
  public viewDefaultRendition(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.viewDefaultRendition()
    );
  }

  /**
   * Clears the rendition of items matching the query, which will revert the
   * item back to the rendition used when creating the item.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Switch the rendition of the given item.
   * await scene.items((op) => [
   *   op.where((q) => q.withItemId('item-uuid')).clearRendition(),
   * ]);
   * ```
   */
  public clearRendition(): SceneItemOperationsBuilder {
    return new SceneItemOperationsBuilder(
      this.query,
      this.builder.clearRendition()
    );
  }

  /**
   * @internal
   */
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
  | 'visibility'
  | 'phantom';

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
    public readonly sceneViewId: UUID.UUID
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
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Deselect everything, then select a specific item by ID
   * await scene.items(op => [
   *   op.where(q => q.all()).deselect(),
   *   op.where(q => q.withItemId('item-id')).select(),
   * ]).execute();
   * ```
   *
   * @see {@link RootQuery} for more information on available queries.
   *
   * @see {@link SceneItemOperationsBuilder} for more information on available operations.
   *
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
      this.dimensions,
      operationList
    );
  }

  /**
   * An instance of the current camera of the scene. The camera provides a number of
   * methods that can be used in combination with the `render` method to make programmatic
   * updates to the scene's camera.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   * const camera = scene.camera();
   *
   * // Fit the camera to the visible bounding box of the scene with a 1 second animation
   * await camera.viewAll().render({ animation: { milliseconds: 1000 } });
   * ```
   *
   * @see {@link Camera} for more information on available camera operations.
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

  /**
   * Returns the current visible BoundingBox for the scene.
   */
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
