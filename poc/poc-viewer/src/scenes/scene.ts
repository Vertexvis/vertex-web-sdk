import { Vector3, BoundingBox, Point } from '@vertexvis/geometry';
import { Camera, Scene as GraphicsScene } from '@vertexvis/poc-graphics-3d';
import { BomItems, BomItem, HitDetection } from '@vertexvis/poc-vertex-api';
import { CommandRegistry } from '../commands/commandRegistry';
import { FrameAttributes } from '../image-streaming-client';
import {
  createBulkBomOperationFromDefinition,
  dedupBulkBomOperations,
} from './bulkBomOperations';
import {
  OperationDefinition,
  SceneCameraOperations,
  SceneItemOperations,
  SceneOperationBuilder,
  SelectorFactory,
} from './operations';
import { HttpClientProvider } from '../api-client/httpClient';
import { Raycaster } from './raycaster';
import { HitsByPixelBody } from '@vertexvis/poc-vertex-api/dist/endpoints/hitDetection';

export interface SceneItemExecutionResponse {
  bomItems: BomItem.BomItem[];
}

export type Executor = (
  definitions: OperationDefinition[]
) => Promise<SceneItemExecutionResponse | null>;

export type PickExecutor = (
  body: HitsByPixelBody
) => Promise<SceneItemExecutionResponse>;

type Frame = Pick<FrameAttributes, 'scene' | 'visibleBoundingBox'>;

interface SceneCameraExecutionOptions {
  animate?: boolean;
  animationOptions?: AnimationOptions;
}

interface AnimationOptions {
  durationInMs: number;
  easing?: string;
}

export function httpBulkBomOperationExecutor(
  httpClientProvider: HttpClientProvider,
  sceneStateId: string
): Executor {
  return async (definitions: OperationDefinition[]) => {
    const operations = dedupBulkBomOperations(
      definitions.reduce(
        (result, def) => [
          ...result,
          ...createBulkBomOperationFromDefinition(def),
        ],
        []
      )
    );
    const response = await BomItems.bulkOperation(
      httpClientProvider(),
      sceneStateId,
      {
        operations,
      }
    );

    return response;
  };
}

export function httpPickExecutor(
  httpClientProvider: HttpClientProvider,
  sceneStateId: string
): PickExecutor {
  return async (body: HitsByPixelBody) => {
    const hitResults = await HitDetection.getHitsByPixel(
      httpClientProvider(),
      sceneStateId,
      body
    );

    return {
      bomItems: hitResults.map(hr => hr.bomItem),
    };
  };
}

export class SceneItemOperationsExecutor
  implements SceneItemOperations<SceneItemOperationsExecutor> {
  protected builder = new SceneOperationBuilder();

  public constructor(
    private executor: Executor,
    private selector?: SelectorFactory
  ) {}

  public execute(): Promise<SceneItemExecutionResponse | null> {
    const operations = this.builder.build();
    return this.executor(operations);
  }

  public clearAllHighlights(): SceneItemOperationsExecutor {
    this.builder.clearAllHighlights();
    return this;
  }

  public showAll(): SceneItemOperationsExecutor {
    this.builder.showAll();
    return this;
  }

  public hideAll(): SceneItemOperationsExecutor {
    this.builder.hideAll();
    return this;
  }

  public hide(): SceneItemOperationsExecutor;
  public hide(selector: SelectorFactory): SceneItemOperationsExecutor;
  public hide(...args: any[]): SceneItemOperationsExecutor {
    if (args.length === 0) {
      this.builder.hide(this.selector);
    } else if (args.length === 1) {
      this.builder.hide(args[0]);
    }
    return this;
  }

  public highlight(color: string): SceneItemOperationsExecutor;
  public highlight(
    color: string,
    selector: SelectorFactory
  ): SceneItemOperationsExecutor;

  public highlight(...args: any[]): SceneItemOperationsExecutor {
    if (args.length === 1) {
      this.builder.highlight(args[0], this.selector);
    } else if (args.length === 2) {
      this.builder.highlight(args[0], args[1]);
    }
    return this;
  }

  public show(): SceneItemOperationsExecutor;
  public show(selector: SelectorFactory): SceneItemOperationsExecutor;
  public show(...args: any[]): SceneItemOperationsExecutor {
    if (args.length === 0) {
      this.builder.show(this.selector);
    } else if (args.length === 1) {
      this.builder.show(args[0]);
    }
    return this;
  }

  public showOnly(): SceneItemOperationsExecutor;
  public showOnly(selector: SelectorFactory): SceneItemOperationsExecutor;
  public showOnly(...args: any[]): SceneItemOperationsExecutor {
    if (args.length === 0) {
      this.builder.showOnly(this.selector);
    } else if (args.length === 1) {
      this.builder.showOnly(args[0]);
    }
    return this;
  }
}

class SceneCameraOperationsExecutor
  implements SceneCameraOperations<SceneCameraOperationsExecutor> {
  public constructor(
    private commands: CommandRegistry,
    private camera: Camera.Camera,
    private boundingBox: BoundingBox.BoundingBox
  ) {}

  public execute({
    animate = false,
    animationOptions,
  }: SceneCameraExecutionOptions = {}): Promise<void> {
    if (!animate) {
      return this.commands.execute('stream.replace-camera', this.camera);
    } else {
      return this.commands.execute(
        'stream.fly-to-camera',
        this.camera,
        this.boundingBox,
        animationOptions?.durationInMs,
        animationOptions?.easing
      );
    }
  }

  public lookAt(lookAt: Vector3.Vector3): SceneCameraOperationsExecutor {
    this.camera = { ...this.camera, lookat: lookAt };
    return this;
  }

  public position(position: Vector3.Vector3): SceneCameraOperationsExecutor {
    this.camera = { ...this.camera, position };
    return this;
  }

  public up(up: Vector3.Vector3): SceneCameraOperationsExecutor {
    this.camera = { ...this.camera, upvector: up };
    return this;
  }

  public set(
    data: Partial<Pick<Camera.Camera, 'position' | 'upvector' | 'lookat'>>
  ): SceneCameraOperationsExecutor {
    this.camera = {
      ...this.camera,
      position: data.position || this.camera.position,
      upvector: data.upvector || this.camera.upvector,
      lookat: data.lookat || this.camera.lookat,
    };
    return this;
  }

  public viewAll(): SceneCameraOperationsExecutor {
    this.camera = Camera.fitToBoundingBox(this.boundingBox, this.camera);
    return this;
  }
}

export class RaycastSceneItemOperationsExecutor extends SceneItemOperationsExecutor {
  public constructor(
    executor: Executor,
    selector: SelectorFactory,
    private pickExecutor: PickExecutor,
    private scene: GraphicsScene.Scene,
    private position: Point.Point
  ) {
    super(executor, selector);
  }

  public execute(): Promise<SceneItemExecutionResponse> {
    const operations = this.builder.build();

    if (operations.length > 0) {
      return super.execute();
    } else {
      return this.pickExecutor({
        camera: this.scene.camera,
        viewport: this.scene.viewport,
        position: this.position,
      });
    }
  }
}

export class Scene implements SceneItemOperations<SceneItemOperationsExecutor> {
  private sceneProvider: () => GraphicsScene.Scene;

  public constructor(
    private executor: Executor,
    private pickExecutor: PickExecutor,
    private commands: CommandRegistry,
    private frameAttributesProvider: () => Frame | undefined
  ) {
    this.sceneProvider = () => {
      const frame = frameAttributesProvider();
      if (frame != null) {
        return frame.scene;
      }
    };
  }

  public raycaster(): Promise<Raycaster> {
    return Promise.resolve(
      new Raycaster(this.executor, this.pickExecutor, this.sceneProvider)
    );
  }

  public clearAllHighlights(): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(this.executor).clearAllHighlights();
  }

  public showAll(): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(this.executor).showAll();
  }

  public hideAll(): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(this.executor).hideAll();
  }

  public hide(selector: SelectorFactory): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(this.executor).hide(selector);
  }

  public highlight(
    color: string,
    selector: SelectorFactory
  ): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(this.executor).highlight(
      color,
      selector
    );
  }

  public show(selector: SelectorFactory): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(this.executor).show(selector);
  }

  public showOnly(selector: SelectorFactory): SceneItemOperationsExecutor {
    return new SceneItemOperationsExecutor(this.executor).showOnly(selector);
  }

  public camera(): SceneCameraOperationsExecutor {
    const attributes = this.frameAttributesProvider();
    if (attributes != null) {
      return new SceneCameraOperationsExecutor(
        this.commands,
        attributes.scene.camera,
        attributes.visibleBoundingBox
      );
    } else {
      new Error('Cannot update camera. Frame has not been loaded.');
    }
  }
}
