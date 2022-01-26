import { Vector3 } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener, UUID } from '@vertexvis/utils';

import { MinimumDistanceMeasurementResult } from './results';

export interface LineOverlay extends Disposable {
  type: 'line';
  id: string;
  start: Vector3.Vector3;
  end: Vector3.Vector3;
}

export interface DistanceVectorOverlay extends Disposable {
  type: 'distance-vector';
  id: string;
  x: { start: Vector3.Vector3; end: Vector3.Vector3 };
  y: { start: Vector3.Vector3; end: Vector3.Vector3 };
  z: { start: Vector3.Vector3; end: Vector3.Vector3 };
}

export type MeasurementOverlay = LineOverlay | DistanceVectorOverlay;

export class MeasurementOverlayManager {
  private overlays = new Map<string, MeasurementOverlay>();
  private overlaysChanged = new EventDispatcher<MeasurementOverlay[]>();

  public addLineFromResult(
    result: MinimumDistanceMeasurementResult
  ): LineOverlay {
    return this.addLine(result.point1, result.point2);
  }

  public addLine(start: Vector3.Vector3, end: Vector3.Vector3): LineOverlay {
    const id = UUID.create();
    const overlay: LineOverlay = {
      type: 'line',
      id: id,
      start,
      end,
      dispose: () => this.remove(id),
    };
    this.addOverlay(overlay);
    return overlay;
  }

  public addDistanceVectorFromResult(
    result: MinimumDistanceMeasurementResult
  ): DistanceVectorOverlay {
    return this.addDistanceVector(result.point1, result.point2);
  }

  public addDistanceVector(
    start: Vector3.Vector3,
    end: Vector3.Vector3
  ): DistanceVectorOverlay {
    const id = UUID.create();
    const v = Vector3.subtract(start, end);

    const ze = Vector3.add(start, Vector3.create(0, 0, -v.z));
    const z = { start, end: ze };

    const ye = Vector3.add(ze, Vector3.create(0, -v.y, 0));
    const y = { start: ze, end: ye };

    const xe = Vector3.add(ye, Vector3.create(-v.x, 0, 0));
    const x = { start: ye, end: xe };

    const overlay: DistanceVectorOverlay = {
      type: 'distance-vector',
      id,
      x,
      y,
      z,
      dispose: () => this.remove(id),
    };
    this.addOverlay(overlay);
    return overlay;
  }

  private addOverlay(overlay: MeasurementOverlay): void {
    if (!this.overlays.has(overlay.id)) {
      this.overlays.set(overlay.id, overlay);
      this.overlaysChanged.emit(this.getOverlays());
    }
  }

  private getOverlays(): MeasurementOverlay[] {
    return Array.from(this.overlays.values());
  }

  private remove(id: string): boolean {
    if (this.overlays.has(id)) {
      this.overlays.delete(id);
      this.overlaysChanged.emit(this.getOverlays());
      return true;
    } else {
      return false;
    }
  }

  public onOverlaysChanged(
    listener: Listener<MeasurementOverlay[]>
  ): Disposable {
    return this.overlaysChanged.on(listener);
  }
}
