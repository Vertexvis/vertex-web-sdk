import { StreamApi } from '@vertexvis/stream-api';
import { Frame } from '../types';
import { Camera } from './camera';
import { Dimensions } from '@vertexvis/geometry';
import { Raycaster } from './raycaster';
import { ColorMaterial } from './colorMaterial';
import { SceneItemOperations, SceneOperationBuilder } from './operations';
import { QueryExpression, SceneItemQueryExecutor } from './queries';
import { CommandRegistry } from '../commands/commandRegistry';
import { UUID } from '@vertexvis/utils';

/**
 * A class that is responsible for building operations for a specific scene.
 * This executor requires a query, and expects `execute()` to be invoked in order
 * for the changes to take effect.
 */
export class SceneItemOperationsExecutor
  implements SceneItemOperations<SceneItemOperationsExecutor> {
  private builder: SceneOperationBuilder;

  public constructor(
    private sceneViewId: UUID.UUID,
    private commands: CommandRegistry,
    private query: QueryExpression,
    givenBuilder?: SceneOperationBuilder
  ) {
    this.builder =
      givenBuilder != null ? givenBuilder : new SceneOperationBuilder();
  }

  public materialOverride(color: ColorMaterial): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(
      this.sceneViewId,
      this.commands,
      this.query,
      this.builder.materialOverride(color)
    );
  }

  public hide(): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(
      this.sceneViewId,
      this.commands,
      this.query,
      this.builder.hide()
    );
  }

  public show(): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(
      this.sceneViewId,
      this.commands,
      this.query,
      this.builder.show()
    );
  }

  public clearMaterialOverrides(): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(
      this.sceneViewId,
      this.commands,
      this.query,
      this.builder.clearMaterialOverrides()
    );
  }

  public execute(): void {
    const operations = this.builder.build();
    this.commands.execute(
      'stream.createSceneAlteration',
      this.sceneViewId,
      this.query,
      operations
    );
  }
}

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
    private commands: CommandRegistry,
    private sceneViewId: UUID.UUID
  ) {}

  public items(): SceneItemQueryExecutor {
    return new SceneItemQueryExecutor(this.sceneViewId, this.commands);
  }

  /**
   * An instance of the current camera of the scene.
   */
  public camera(): Camera {
    return new Camera(
      this.stream,
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
