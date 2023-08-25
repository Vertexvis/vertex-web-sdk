export type ViewerTeleportMode = 'teleport' | 'teleport-and-align';

export class WalkModeModel {
  private enabled = true;
  private heightScalar = 0.1175;
  private teleportMode?: ViewerTeleportMode;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setTeleportMode(mode?: ViewerTeleportMode): void {
    this.teleportMode = mode;
  }

  public setHeightScalar(scalar: number): void {
    this.heightScalar = scalar;
  }

  public getEnabled(): boolean {
    return this.enabled;
  }

  public getTeleportMode(): ViewerTeleportMode | undefined {
    return this.teleportMode;
  }

  public getHeightScalar(): number {
    return this.heightScalar;
  }
}
