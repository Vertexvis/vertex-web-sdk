import { StreamApi } from '@vertexvis/stream-api';
import { Frame } from '../types';
import { Camera } from './camera';
import { Dimensions } from '@vertexvis/geometry';
import { Raycaster } from './raycaster';
import {
  SceneItemOperations,
  SceneOperationBuilder,
  SelectorBuilder,
  ItemSelectorBuilder,
  SceneItemQuery,
} from './operations';

export class SceneItemOperationsExecutor
  implements SceneItemOperations<SceneItemOperationsExecutor> {
  protected builder = new SceneOperationBuilder();
  private queryExecutor: SceneItemQueryExecutor;
  public constructor(
    queryExecutor?: SceneItemQueryExecutor,
    query?: SelectorBuilder<ItemSelectorBuilder>
  ) {
    this.queryExecutor = queryExecutor || new SceneItemQueryExecutor();
    if (query != null) {
      queryExecutor.where(query);
    }
  }

  public material(color: string): SceneItemOperationsExecutor {
    this.builder.material(color);
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
    console.log('operations: ', operations);
  }
}

export class SceneItemQueryExecutor implements SceneItemQuery {
  protected builder = new SceneOperationBuilder();
  public where(
    query: SelectorBuilder<ItemSelectorBuilder>
  ): SceneItemOperationsExecutor {
    console.log(query);
    return new SceneItemOperationsExecutor(this);
  }
}

/**
 * A class that represents the `Scene` that has been loaded into the viewer. On
 * it, you can retrieve attributes of the scene, such as the camera. It also
 * contains methods for updating the scene and performing requests to rerender
 * the scene.
 */
export class Scene {
  private operationBuilder = new SceneOperationBuilder();
  private queryBuilder = new SceneOperationBuilder();
  public constructor(private stream: StreamApi, private frame: Frame.Frame) {}

  // public execute(): void {
  //   const operations = this.operationBuilder.build();
  //   console.log(operations);
  // }

  public itemOperation(): SceneItemQueryExecutor {
    return new SceneItemQueryExecutor();
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
