import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { ViewerTeleportMode, WalkModeModel } from './model';

export class WalkModeController {
  private teleportModeChanged: EventDispatcher<ViewerTeleportMode | undefined> =
    new EventDispatcher();

  public constructor(private model: WalkModeModel) {}

  /**
   * Sets the `ViewerTeleportMode` to be used with a `<vertex-viewer-teleport-tool>`.
   */
  public setTeleportMode(mode?: ViewerTeleportMode): void {
    this.model.setTeleportMode(mode);
    this.teleportModeChanged.emit(mode);
  }

  /**
   * Updates the scalar to use when computing the distance to offset the camera
   * when performing a `teleport-and-align`. This can be used to fine-tune the
   * offset from a surface when performing this operation.
   */
  public setHeightScalar(scalar: number): void {
    this.model.setHeightScalar(scalar);
  }

  public getTeleportMode(): ViewerTeleportMode | undefined {
    return this.model.getTeleportMode();
  }

  public getHeightScalar(): number {
    return this.model.getHeightScalar();
  }

  public onTeleportModeChange(
    listener: Listener<ViewerTeleportMode | undefined>
  ): Disposable {
    return this.teleportModeChanged.on(listener);
  }
}
