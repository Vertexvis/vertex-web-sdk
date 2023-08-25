import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { ViewerTeleportMode, WalkModeModel } from './model';

export class WalkModeController {
  private enabledChanged: EventDispatcher<boolean> = new EventDispatcher();

  private teleportModeChanged: EventDispatcher<ViewerTeleportMode | undefined> =
    new EventDispatcher();

  public constructor(private model: WalkModeModel) {}

  public setEnabled(enabled: boolean): void {
    this.model.setEnabled(enabled);
    this.enabledChanged.emit(enabled);
  }

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

  public getEnabled(): boolean {
    return this.model.getEnabled();
  }

  public getTeleportMode(): ViewerTeleportMode | undefined {
    return this.model.getTeleportMode();
  }

  public getHeightScalar(): number {
    return this.model.getHeightScalar();
  }

  public onEnabledChange(listener: Listener<boolean>): Disposable {
    return this.enabledChanged.on(listener);
  }

  public onTeleportModeChange(
    listener: Listener<ViewerTeleportMode | undefined>
  ): Disposable {
    return this.teleportModeChanged.on(listener);
  }
}
