import { Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';

import {
  Pin,
  PinModel,
  PinStyleAttributes,
  ViewerPinToolMode,
  ViewerPinToolType,
} from './model';

export interface Draggable {
  id: string;
  lastPoint?: Point.Point;
}

/**
 * The `PinController` is responsible for adding pin entities to the viewer canvas
 */
export class PinController {
  private draggable?: Draggable;

  public constructor(
    private model: PinModel,
    private mode: ViewerPinToolMode = 'view',
    private type: ViewerPinToolType = 'pin-icon',
    private styleAttributes: PinStyleAttributes | undefined = undefined
  ) {}

  /**
   * Registers an entity to place on the canvas and places the pin on the associated part.
   *
   * @param pin The pin entity
   * @returns A void promise
   */
  public addPin(pin: Pin): void {
    this.model.addPin(pin);
  }

  /**
   * Clears all entities and returns a promise that resolves with an empty list
   * of pin results.
   */
  public clearPins(): void {
    this.model.clearPins();
  }

  /**
   * Deregisters an entity and performs a pin if this entity was
   * removed.
   *
   * @param entity The entity to remove.
   * @returns A promise that resolves with the results after removing this
   * entity.
   */
  public removePin(pin: Pin): void {
    this.model.removePin(pin);
  }

  /**
   * Registers a set of entities and adds a pin
   *
   * @param entities The pin entities to draw.
   * @returns A promise that resolves with the results after registering these
   * entities.
   */
  public setPins(pins: Set<Pin>): void {
    this.model.setPins(pins);
  }

  /**
   * Sets the set of entities to be placed with the model.
   *
   * @param pin A pin to set
   * @returns `true` if the entity has been added.
   */
  public setPin(pin: Pin): void {
    this.model.setPin(pin);
  }

  /**
   * Updates an existing pin
   * @param pin A pin to set
   * @returns `true` if the entity has been updated, false otherwise
   */
  public updatePin(pin: Pin): void {
    this.model.updatePin(pin);
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

  public getDraggable(): Draggable | undefined {
    return this.draggable;
  }

  public setDraggable(draggable: Draggable | undefined): void {
    this.draggable = draggable;
  }

  public setPrimaryColor(color?: Color.Color | string): void {
    this.styleAttributes = {
      ...this.styleAttributes,
      primaryColor: color,
    };
  }

  public setAccentColor(color?: Color.Color | string): void {
    this.styleAttributes = {
      ...this.styleAttributes,
      accentColor: color,
    };
  }

  public getStyleAttributes(): PinStyleAttributes | undefined {
    return this.styleAttributes;
  }

  public updateDraggable(
    draggable: Draggable,
    worldPosition: Vector3.Vector3,
    partId?: string
  ): void {
    if (this.draggable != null) {
      this.draggable = draggable;
    }
    const pin = this.model.getPinById(draggable.id);
    if (pin != null) {
      this.updatePin({
        ...pin,
        worldPosition,
        partId,
      });
    }
  }
}
