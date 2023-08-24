export type ViewerTeleportMode = 'teleport' | 'teleport-and-align';

export class WalkModeModel {
  private heightScalar = 0.1175;
  private teleportMode?: ViewerTeleportMode;

  public setTeleportMode(mode?: ViewerTeleportMode): void {
    this.teleportMode = mode;
  }

  public setHeightScalar(scalar: number): void {
    this.heightScalar = scalar;
  }

  public getTeleportMode(): ViewerTeleportMode | undefined {
    return this.teleportMode;
  }

  public getHeightScalar(): number {
    return this.heightScalar;
  }
}
