import { Point, Vector3 } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';
import { Raycaster } from '../../lib/scenes';
import { PointToPointHitTester } from './hitTest';
import { fromPbVector3f } from '../../lib/mappers';
import { Mapper } from '@vertexvis/utils';
import { PointToPointMeasurementResult } from '../../lib/measurement';
import { Anchor } from './utils';

/**
 * Provides APIs to perform local or remote hit tests.
 */
export interface PointToPointHitProvider {
  /**
   * Returns a hit tester that can be used to test if a point is over geometry
   * without having to do an API call.
   */
  hitTester(): PointToPointHitTester;

  /**
   * Returns a raycaster that can be used to perform hits through API calls.
   */
  raycaster(): Promise<Raycaster>;
}

/**
 * A controller to handle point-to-point measurement interactions.
 */
export class PointToPointInteractionController {
  public constructor(private readonly model: PointToPointInteractionModel) {}

  /**
   * Returns an interaction handler to perform a new measurement.
   *
   * @param pt A point in viewport coordinates.
   * @param hits A provider to perform hits.
   * @returns An interaction handler, or `undefined` if the point does not hit
   *  any geometry.
   */
  public newMeasurement(
    pt: Point.Point,
    hits: PointToPointHitProvider
  ): PointToPointInteraction | undefined {
    const world = hits.hitTester().transformPointToWorld(pt);
    return world != null
      ? new NewMeasurementInteraction(pt, world, this.model)
      : undefined;
  }

  /**
   * Returns an interaction handler to edit an existing measurement.
   *
   * @param anchor The anchor to edit.
   * @returns An interaction handler to edit a measurement.
   */
  public editMeasurement(anchor: Anchor): PointToPointInteraction {
    const measurement = this.model.getMeasurement();

    if (measurement == null) {
      throw new Error('Cannot edit measurement. Measurement is empty.');
    }

    return anchor === 'start'
      ? new EditStartAnchorInteraction(measurement, this.model)
      : new EditEndAnchorInteraction(measurement, this.model);
  }

  /**
   * Clears the position of the feedback indicator.
   */
  public clearIndicator(): void {
    this.model.setIndicator(undefined);
  }

  /**
   * Updates the position of the feedback indicator.
   *
   * @param pt A point, in viewport coordinates.
   * @param hits A provider to perform hits.
   * @returns `true` if the indicator is over geometry.
   */
  public moveIndicator(
    pt: Point.Point,
    hits: PointToPointHitProvider
  ): boolean {
    const worldPt = hits.hitTester().transformPointToWorld(pt);
    this.model.setIndicator(worldPt);
    return worldPt != null;
  }
}

/**
 * The model for point-to-point interactions.
 */
export class PointToPointInteractionModel {
  private indicator?: Vector3.Vector3;
  private measurement?: PointToPointMeasurementResult;

  private measurementChanged = new EventDispatcher<
    PointToPointMeasurementResult | undefined
  >();

  private indicatorChanged = new EventDispatcher<Vector3.Vector3 | undefined>();

  /**
   * Returns a model that doesn't have the indicator or measurement set.
   */
  public static empty(): PointToPointInteractionModel {
    return new PointToPointInteractionModel();
  }

  /**
   * Returns the current measurement for the interaction.
   */
  public getMeasurement(): PointToPointMeasurementResult | undefined {
    return this.measurement;
  }

  /**
   * Updates the measurement and emits a change event.
   *
   * @param measurement The new measurement.
   */
  public setMeasurement(
    measurement: PointToPointMeasurementResult | undefined
  ): void {
    if (this.measurement !== measurement) {
      this.measurement = measurement;
      this.measurementChanged.emit(measurement);
    }
  }

  /**
   * Updates the measurement from the given values. If `start` or `end` are
   * `undefined` the measurement will be cleared.
   *
   * @param start The start point.
   * @param end The end point.
   * @param valid `true` if the measurement is valid.
   */
  public setMeasurementFromValues(
    start: Vector3.Vector3 | undefined,
    end: Vector3.Vector3 | undefined,
    valid: boolean
  ): void {
    if (start != null && end != null) {
      const measurement = valid
        ? validMeasurement(start, end)
        : invalidMeasurement(start, end);
      this.setMeasurement(measurement);
    } else {
      this.setMeasurement(undefined);
    }
  }

  /**
   * Adds a callback that is invoked when the measurement changes.
   *
   * @param listener The callback to register.
   * @returns A `Disposable` to remove the event listener.
   */
  public onMeasurementChanged(
    listener: Listener<PointToPointMeasurementResult | undefined>
  ): Disposable {
    return this.measurementChanged.on(listener);
  }

  /**
   * Gets the position representing the feedback indicator.
   */
  public getIndicator(): Vector3.Vector3 | undefined {
    return this.indicator;
  }

  /**
   * Updates the position of the feedback indicator.
   */
  public setIndicator(pt: Vector3.Vector3 | undefined): void {
    if (this.indicator !== pt) {
      this.indicator = pt;
      this.indicatorChanged.emit(pt);
    }
  }

  /**
   * Adds a callback that is invoked when the feedback indicator position
   * changes.
   *
   * @param listener The callback to register.
   * @returns A `Disposable` to remove the event listener.
   */
  public onIndicatorChanged(
    listener: Listener<Vector3.Vector3 | undefined>
  ): Disposable {
    return this.indicatorChanged.on(listener);
  }
}

/**
 * An interface for performing point-to-point measurement interactions.
 *
 * @see {@link PointToPointInteractionController} to start an interaction.
 */
export interface PointToPointInteraction {
  /**
   * UI should call this for each user iteration.
   *
   * @param pt A point, in viewport coordinates.
   * @param hits A provider to perform hits.
   */
  update(
    pt: Point.Point,
    hits: PointToPointHitProvider
  ): PointToPointMeasurementResult;

  /**
   * UI should call this when the user interaction is finished. Returns a
   * `Promise` that resolves with the final measurement.
   *
   * @param pt A point, in viewport coordinates.
   * @param hits A provider to perform hits.
   */
  finish(
    pt: Point.Point,
    hits: PointToPointHitProvider
  ): Promise<PointToPointMeasurementResult>;
}

/**
 * An interaction handler to perform a new measurement. As a user is performing
 * an interaction, the handler will fetch the position of the starting anchor.
 * While fetching the position, a position from the depth buffer will be used.
 */
class NewMeasurementInteraction implements PointToPointInteraction {
  private pendingStart: Promise<void> | undefined;
  private hitWorld: Vector3.Vector3 | undefined;
  private hitWorldValid = true;

  public constructor(
    public readonly pt: Point.Point,
    public readonly world: Vector3.Vector3,
    private readonly model: PointToPointInteractionModel
  ) {}

  private fetchStartIfMissing(hits: PointToPointHitProvider): void {
    if (this.pendingStart == null) {
      this.pendingStart = this.fetchStart(hits);
    }
  }

  private async fetchStart(hits: PointToPointHitProvider): Promise<void> {
    const raycaster = await hits.raycaster();
    const hitPt = await getHit(raycaster, this.pt);

    if (hitPt == null) {
      // If the hit is empty, fallback to using a point derived from the depth
      // buffer.
      const invalidPt = hits.hitTester().transformPointToWorld(this.pt);

      this.hitWorld = invalidPt;
      this.hitWorldValid = false;
    } else {
      this.hitWorld = hitPt;
      this.hitWorldValid = true;
    }
  }

  public update(
    pt: Point.Point,
    hits: PointToPointHitProvider
  ): PointToPointMeasurementResult {
    this.fetchStartIfMissing(hits);

    const end = hits
      .hitTester()
      .transformPointToWorld(pt, { ignoreHitTest: true });
    const isHit = hits.hitTester().hitTest(pt);
    const start = this.hitWorld ?? this.world;

    if (end == null) {
      throw new Error(
        'Cannot update new measurement interaction. End point is empty.'
      );
    } else if (!this.hitWorldValid || !isHit) {
      this.model.setIndicator(end);
      return this.setMeasurement(invalidMeasurement(start, end));
    } else {
      this.model.setIndicator(end);
      return this.setMeasurement(validMeasurement(start, end));
    }
  }

  public async finish(
    pt: Point.Point,
    hits: PointToPointHitProvider
  ): Promise<PointToPointMeasurementResult> {
    // Wait for the hit for the starting point.
    this.fetchStartIfMissing(hits);
    await this.pendingStart;

    const raycaster = await hits.raycaster();
    const hitPt = await getHit(raycaster, pt);
    const start = this.hitWorld ?? this.world;

    this.model.setIndicator(undefined);

    if (hitPt == null) {
      const end = hits
        .hitTester()
        .transformPointToWorld(pt, { ignoreHitTest: true });
      if (end == null) {
        throw new Error(
          'Cannot complete new measurement interaction. End point is empty.'
        );
      }
      return this.setMeasurement(invalidMeasurement(start, end));
    } else if (!this.hitWorldValid) {
      return this.setMeasurement(invalidMeasurement(start, hitPt));
    } else {
      return this.setMeasurement(validMeasurement(start, hitPt));
    }
  }

  private setMeasurement(
    measurement: PointToPointMeasurementResult
  ): PointToPointMeasurementResult {
    this.model.setMeasurement(measurement);
    return measurement;
  }
}

/**
 * Base class for an edit anchor interaction.
 *
 * @see {@link EditStartAnchorInteraction}
 * @see {@link EditEndAnchorInteraction}
 */
abstract class EditAnchorInteraction implements PointToPointInteraction {
  public constructor(
    protected readonly measurement: PointToPointMeasurementResult,
    protected readonly model: PointToPointInteractionModel
  ) {}

  public update(
    pt: Point.Point,
    context: PointToPointHitProvider
  ): PointToPointMeasurementResult {
    const world = context
      .hitTester()
      .transformPointToWorld(pt, { ignoreHitTest: true });
    const isHit = context.hitTester().hitTest(pt);

    if (world == null) {
      throw new Error(
        'Cannot update new measurement interaction. End point is empty.'
      );
    } else if (!isHit) {
      return this.setMeasurement(this.getInvalidMeasurement(world));
    } else {
      return this.setMeasurement(this.getValidMeasurement(world));
    }
  }

  public async finish(
    pt: Point.Point,
    hits: PointToPointHitProvider
  ): Promise<PointToPointMeasurementResult> {
    const raycaster = await hits.raycaster();
    const hitPt = await getHit(raycaster, pt);

    if (hitPt == null) {
      const end = hits
        .hitTester()
        .transformPointToWorld(pt, { ignoreHitTest: true });
      if (end == null) {
        throw new Error(
          'Cannot complete edit measurement interaction. End point is empty.'
        );
      }
      return this.setMeasurement(this.getInvalidMeasurement(end));
    } else {
      return this.setMeasurement(this.getValidMeasurement(hitPt));
    }
  }

  private setMeasurement(
    measurement: PointToPointMeasurementResult
  ): PointToPointMeasurementResult {
    this.model.setMeasurement(measurement);
    return measurement;
  }

  protected abstract getInvalidMeasurement(
    world: Vector3.Vector3
  ): PointToPointMeasurementResult;

  protected abstract getValidMeasurement(
    world: Vector3.Vector3
  ): PointToPointMeasurementResult;
}

class EditStartAnchorInteraction
  extends EditAnchorInteraction
  implements PointToPointInteraction
{
  public constructor(
    measurement: PointToPointMeasurementResult,
    model: PointToPointInteractionModel
  ) {
    super(measurement, model);
  }

  protected getInvalidMeasurement(
    startPt: Vector3.Vector3
  ): PointToPointMeasurementResult {
    return invalidMeasurement(startPt, this.measurement.end);
  }

  protected getValidMeasurement(
    startPt: Vector3.Vector3
  ): PointToPointMeasurementResult {
    return validMeasurement(startPt, this.measurement.end);
  }
}

class EditEndAnchorInteraction
  extends EditAnchorInteraction
  implements PointToPointInteraction
{
  public constructor(
    measurement: PointToPointMeasurementResult,
    model: PointToPointInteractionModel
  ) {
    super(measurement, model);
  }

  protected getInvalidMeasurement(
    endPt: Vector3.Vector3
  ): PointToPointMeasurementResult {
    return invalidMeasurement(this.measurement.start, endPt);
  }

  protected getValidMeasurement(
    endPt: Vector3.Vector3
  ): PointToPointMeasurementResult {
    return validMeasurement(this.measurement.start, endPt);
  }
}

async function getHit(
  raycaster: Raycaster,
  pt: Point.Point
): Promise<Vector3.Vector3 | undefined> {
  const hitRes = await raycaster.hitItems(pt);
  const [hit] = hitRes?.hits ?? [];

  if (hit?.hitPoint != null) {
    const hitPt = fromPbVector3f(hit.hitPoint);
    if (Mapper.isInvalid(hitPt)) {
      throw new Error(`Invalid hit response [${hitPt.errors.join(',')}]`);
    }
    return hitPt;
  } else return undefined;
}

function validMeasurement(
  start: Vector3.Vector3,
  end: Vector3.Vector3
): PointToPointMeasurementResult {
  return {
    type: 'point-to-point',
    start,
    end,
    distance: Vector3.distance(start, end),
    valid: true,
  };
}

function invalidMeasurement(
  start: Vector3.Vector3,
  end: Vector3.Vector3
): PointToPointMeasurementResult {
  return {
    type: 'point-to-point',
    start,
    end,
    valid: false,
  };
}
