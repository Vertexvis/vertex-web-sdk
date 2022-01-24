import {
  Disposable,
  EventDispatcher,
  Listener,
  Objects,
} from '@vertexvis/utils';

import {
  ImpreciseMeasurementEntity,
  MeasurementEntity,
  PreciseMeasurementEntity,
} from './entities';
import { MeasurementOutcome } from './outcomes';
import { MeasurementResult } from './results';

/**
 * A model representing the state of measurement.
 *
 * Measurement contains a set of `MeasureEntity`s that represent what's being
 * measured, and a set of `MeasurementResult`s representing the results of the
 * measurement.
 *
 * Views can register event listeners to the model to be notified when new
 * measurements have been added.
 */
export class MeasurementModel {
  private entities = new Set<MeasurementEntity>();
  private outcome?: MeasurementOutcome;
  private results = new Set<MeasurementResult>();

  private entitiesChanged = new EventDispatcher<MeasurementEntity[]>();

  private outcomeChanged = new EventDispatcher<
    MeasurementOutcome | undefined
  >();

  /**
   * Registers an entity to be measured with the model.
   *
   * @param entity An entity to measure.
   * @returns `true` if the entity has been added.
   */
  public addEntity(entity: MeasurementEntity): boolean {
    if (!this.entities.has(entity)) {
      this.entities.add(entity);
      this.entitiesChanged.emit(this.getEntities());
      return true;
    } else {
      return false;
    }
  }

  /**
   * Clears all registered entities from the model.
   */
  public clearEntities(): void {
    this.entities.forEach((e) => this.removeEntity(e));
  }

  /**
   * Clears the outcome containing the results of a measurement.
   */
  public clearOutcome(): void {
    this.setOutcome(undefined);
  }

  /**
   * Sets the outcome containing the results of a measurement.
   *
   * Emits a _outcome changed_ event.
   *
   * @param outcome The outcome containing results.
   */
  public setOutcome(outcome: MeasurementOutcome | undefined): void {
    if (!Objects.isEqual(this.outcome, outcome)) {
      console.log('set outcome', outcome);
      this.outcome = outcome;
      this.outcomeChanged.emit(outcome);
    }
  }

  /**
   * Returns all the entities registered with the model.
   */
  public getEntities(): MeasurementEntity[] {
    return Array.from(this.entities);
  }

  public getImpreciseEntities(): ImpreciseMeasurementEntity[] {
    return this.getEntities().filter(
      (e) => e instanceof ImpreciseMeasurementEntity
    ) as ImpreciseMeasurementEntity[];
  }

  public getPreciseEntities(): PreciseMeasurementEntity[] {
    return this.getEntities().filter(
      (e) => e instanceof PreciseMeasurementEntity
    ) as PreciseMeasurementEntity[];
  }

  /**
   * Returns the outcome that contains the results of a measurement.
   */
  public getOutcome(): MeasurementOutcome | undefined {
    return this.outcome;
  }

  /**
   * Returns all the measurement results of the model.
   */
  public getResults(): MeasurementResult[] {
    return Array.from(this.results);
  }

  /**
   * Unregisters an entity from the model.
   *
   * @param entity The entity to remove.
   * @returns `true` if the entity was removed.
   */
  public removeEntity(entity: MeasurementEntity): boolean {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.entitiesChanged.emit(this.getEntities());
      return true;
    } else {
      return false;
    }
  }

  /**
   * Sets the set of entities to be measured with the model.
   *
   * @param entities A set of entities to measure.
   * @returns `true` if the entity has been added.
   */
  public setEntities(entities: Set<MeasurementEntity>): boolean {
    this.entities.clear();
    entities.forEach((e) => this.entities.add(e));
    this.entitiesChanged.emit(this.getEntities());
    return true;
  }

  /**
   * Registers an event listener that will be invoked when the model's outcome
   * changes.
   *
   * @param listener The listener to add.
   * @returns A disposable that can be used to remove the listener.
   */
  public onOutcomeChanged(
    listener: Listener<MeasurementOutcome | undefined>
  ): Disposable {
    return this.outcomeChanged.on(listener);
  }

  /**
   * Registers an event listener that will be invoked when the model's
   * measurement entities change.
   *
   * @param listener The listener to add.
   * @returns A disposable that can be used to remove the listener.
   */
  public onEntitiesChanged(
    listener: Listener<MeasurementEntity[]>
  ): Disposable {
    return this.entitiesChanged.on(listener);
  }
}
