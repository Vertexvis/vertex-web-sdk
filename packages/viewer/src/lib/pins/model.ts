import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { Pin, PinEntity } from './entities';

/**
 * A model representing the state of pins.
 *
 */
export class PinModel {
  private entities: Record<string, PinEntity> = {};
  private selectedPinId?: string;

  private entitiesChanged = new EventDispatcher<PinEntity[]>();
  private selectionChanged = new EventDispatcher<string | undefined>();

  /**
   * Registers an entity to be drawn in the canvas
   *
   * @param entity A pin entity to draw.
   * @returns `true` if the entity has been added.
   */
  public addEntity(entity: PinEntity): boolean {
    if (this.entities[entity.id] == null) {
      this.entities = {
        ...this.entities,
        [entity.id]: entity,
      };

      this.setSelectedPin(entity.id);
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
    this.getEntities().forEach((e) => this.removeEntity(e));
  }

  /**
   * Returns all the entities registered with the model.
   */
  public getEntities(): PinEntity[] {
    return Object.keys(this.entities).map((key) => this.entities[key]);
  }

  public getSelectedPinId(): string | undefined {
    return this.selectedPinId;
  }

  /**
   * Unregisters an entity from the model.
   *
   * @param entity The entity to remove.
   * @returns `true` if the entity was removed.
   */
  public removeEntity(entity: PinEntity): boolean {
    if (this.entities[entity.id] != null) {
      delete this.entities[entity.id];
      this.entitiesChanged.emit(this.getEntities());
      return true;
    } else {
      return false;
    }
  }

  /**
   * Sets the set of entities to be placed with the model.
   *
   * @param entities A set of entities to draw.
   * @returns `true` if the entity has been added.
   */
  public setEntities(entities: Set<PinEntity>): boolean {
    this.clearEntities();
    entities.forEach((e) => this.addEntity(e));
    this.entitiesChanged.emit(this.getEntities());

    return true;
  }

  /**
   * Sets the set of entities to be placed with the model.
   *
   * @param entities A set of entities to draw.
   * @returns `true` if the entity has been added.
   */
  public setEntity(entity: Pin): boolean {
    this.entities = {
      ...this.entities,
      [entity.id]: entity,
    };
    this.entitiesChanged.emit(this.getEntities());
    return true;
  }

  /**
   * Registers an event listener that will be invoked when the model's
   * pin entities change.
   *
   * @param listener The listener to add.
   * @returns A disposable that can be used to remove the listener.
   */
  public onEntitiesChanged(listener: Listener<PinEntity[]>): Disposable {
    return this.entitiesChanged.on(listener);
  }

  /**
   * Registers an event listener that will be invoked when the model's
   * pin selection changes
   *
   * @param listener The listener to add.
   * @returns A disposable that can be used to remove the listener.
   */
  public onSelectionChange(listener: Listener<string | undefined>): Disposable {
    return this.selectionChanged.on(listener);
  }

  /**
   * Sets the selected pin Id
   * @param pinId
   */
  public setSelectedPin(pinId?: string): void {
    this.selectedPinId = pinId;
    this.selectionChanged.emit(this.selectedPinId);
  }
}
