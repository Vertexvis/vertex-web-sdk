import {
  ViewerPinToolMode,
  ViewerPinToolType,
} from '../../components/viewer-pin-tool/viewer-pin-tool';
import { Pin } from './entities';
import { PinModel } from './model';

/**
 * The `PinController` is responsible for adding pin entities to the viewer canvas
 */
export class PinController {
  private dragging?: boolean = false;
  public constructor(
    private model: PinModel,
    private mode: ViewerPinToolMode = 'view',
    private type: ViewerPinToolType = 'pin'
  ) {}

  /**
   * Registers an entity to place on the canvas and places the pin on the associated part.
   *
   * @param entity The pin entity
   * @returns A void promise
   */
  public addEntity(entity: Pin): void {
    this.model.addEntity(entity);
  }

  /**
   * Clears all entities and returns a promise that resolves with an empty list
   * of pin results.
   */
  public clearEntities(): void {
    this.model.clearEntities();
  }

  /**
   * Deregisters an entity and performs a pin if this entity was
   * removed.
   *
   * @param entity The entity to remove.
   * @returns A promise that resolves with the results after removing this
   * entity.
   */
  public removeEntity(entity: Pin): void {
    this.model.removeEntity(entity);
  }

  /**
   * Registers a set of entities and adds a pin
   *
   * @param entities The pin entities to draw.
   * @returns A promise that resolves with the results after registering these
   * entities.
   */
  public setEntities(entities: Set<Pin>): void {
    this.model.setEntities(entities);
  }

  /**
   * Sets the set of entities to be placed with the model.
   *
   * @param entities A set of entities to draw.
   * @returns `true` if the entity has been added.
   */
  public setEntity(entity: Pin): void {
    this.model.setEntity(entity);
  }

  /**
   * Tells the controller which pin is selected in the model
   * @param pinId
   */
  public setSelectedPinId(pinId?: string): void {
    this.model.setSelectedPin(pinId);
  }

  public getToolMode(): ViewerPinToolMode {
    return this.mode;
  }

  public getToolType(): ViewerPinToolType {
    return this.type;
  }

  public setToolMode(mode: ViewerPinToolMode): void {
    this.mode = mode;
  }

  public setToolType(type: ViewerPinToolType): void {
    this.type = type;
  }

  public getDragging(): boolean {
    return this.dragging || false;
  }

  public setDragging(dragging: boolean): void {
    this.dragging = dragging;
  }
}
