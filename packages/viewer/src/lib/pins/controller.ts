import { PinEntity } from './entities';
import { PinModel } from './model';

/**
 * The `PinController` is responsible for adding pin entities to the viewer canvis
 */
export class PinController {
  public constructor(private model: PinModel) {}

  /**
   * Registers an entity to place on the canvis and places the pin on the associated part.
   *
   * @param entity The pin entity
   * @returns A void promise
   */
  public addEntity(entity: PinEntity): void {
    this.model.addEntity(entity);
  }

  /**
   * Clears all entities and returns a promise that resolves with an empty list
   * of measurement results.
   */
  public clearEntities(): void {
    this.model.clearEntities();
  }

  /**
   * Deregisters an entity and performs a measurement if this entity was
   * removed.
   *
   * @param entity The entity to remove.
   * @returns A promise that resolves with the results after removing this
   * entity.
   */
  public removeEntity(entity: PinEntity): void {
    this.model.removeEntity(entity);
  }

  /**
   * Registers a set of entities and performs a measurement
   *
   * @param entities The entities to measure.
   * @returns A promise that resolves with the results after registering these
   * entities.
   */
  public setEntities(entities: Set<PinEntity>): void {
    this.model.setEntities(entities);
  }
}
