import { Point } from '@vertexvis/geometry';
import {
  Executor,
  PickExecutor,
  RaycastSceneItemOperationsExecutor,
} from './scene';
import { Scene } from '@vertexvis/poc-graphics-3d';
import { IllegalStateError } from '../errors';
import { PositionSelectorBuilder } from './selectors';

export class Raycaster {
  private position: Point.Point;
  private scene: Scene.Scene;

  public constructor(
    private executor: Executor,
    private pickExecutor: PickExecutor,
    private sceneProvider: () => Scene.Scene
  ) {}

  public intersectItems(
    position: Point.Point
  ): RaycastSceneItemOperationsExecutor {
    this.scene = this.sceneProvider();

    if (this.scene != null) {
      this.position = position;

      return new RaycastSceneItemOperationsExecutor(
        this.executor,
        () =>
          new PositionSelectorBuilder(
            position,
            this.scene.camera,
            this.scene.viewport
          ),
        this.pickExecutor,
        this.scene,
        this.position
      );
    } else {
      throw new IllegalStateError(
        'Unable to perform position based operation, as the scene has not been loaded.'
      );
    }
  }
}
