import { StreamApi } from '@vertexvis/stream-api';
import { Frame } from '../types';
import { Camera } from './camera';
import { Dimensions } from '@vertexvis/geometry';
import { Raycaster } from './raycaster';
import { ColorMaterial } from './colorMaterial';
import { SceneItemOperations, SceneOperationBuilder } from './operations';
import { SceneItemQuery, Selector, ItemSelectorBuilder } from './selectors';
import { CommandRegistry } from '../commands/commandRegistry';
import { UUID } from '@vertexvis/utils';

export class SceneItemOperationsExecutor
  implements SceneItemOperations<SceneItemOperationsExecutor> {
  protected builder = new SceneOperationBuilder();

  public constructor(
    private sceneViewId: UUID.UUID,
    private commands: CommandRegistry,
    private query: ItemSelectorBuilder
  ) {}

  public materialOverride(color: ColorMaterial): SceneItemOperationsExecutor {
    this.builder.materialOverride(color);
    return this;
  }

  public hide(): SceneItemOperationsExecutor {
    this.builder.hide();
    return this;
  }

  public show(): SceneItemOperationsExecutor {
    this.builder.show();
    return this;
  }

  public execute(): void {
    const operations = this.builder.build();
    const builtQuery = this.query.build();
    this.commands.execute(
      'stream.createSceneAlteration',
      this.sceneViewId,
      builtQuery,
      operations
    );
  }
}

export class SceneItemQueryExecutor implements SceneItemQuery {
  public constructor(
    private sceneViewId: UUID.UUID,
    private commands: CommandRegistry
  ) {}

  public where(
    query: (clientBuilder: Selector) => void
  ): SceneItemOperationsExecutor {
    const builder = new ItemSelectorBuilder();
    query(builder);
    return new SceneItemOperationsExecutor(
      this.sceneViewId,
      this.commands,
      builder
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
