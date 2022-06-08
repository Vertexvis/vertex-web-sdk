import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

/**
 * The types of pins that can be performed by this tool.
 */
export type ViewerPinToolType = 'pin' | 'pin-label';

/**
 * The mode of the pin tool
 */
export type ViewerPinToolMode = 'edit' | 'view';

/**
 * A model representing the state of pins.
 *
 */

import { Point, Vector3 } from '@vertexvis/geometry';

interface BasePin {
  id: string;
  worldPosition: Vector3.Vector3;
  partId?: string;
}

export interface TextPin extends BasePin {
  type: 'text';
  label: PinLabel;
}

// Future: Support custom icons.
export interface IconPin extends BasePin {
  type: 'icon';
}

export type Pin = IconPin | TextPin;

export interface PinLabel {
  point: Point.Point;
  text?: string;
}

export function isTextPin(pin?: Pin): pin is TextPin {
  return pin?.type === 'text';
}

export function isIconPin(pin?: Pin): pin is Pin {
  return pin?.type === 'icon';
}

export class PinModel {
  private entities: Record<string, Pin> = {};
  private selectedPinId?: string;

  private entitiesChanged = new EventDispatcher<Pin[]>();
  private selectionChanged = new EventDispatcher<string | undefined>();

  /**
   * Registers an entity to be drawn in the canvas
   *
   * @param pin A pin entity to draw.
   * @returns `true` if the entity has been added.
   */
  public addPin(pin: Pin, surpressEvent = false): boolean {
    if (this.entities[pin.id] == null) {
      this.entities = {
        ...this.entities,
        [pin.id]: pin,
      };

      if (!surpressEvent) {
        this.entitiesChanged.emit(this.getPins());
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Clears all registered entities from the model.
   */
  public clearPins(): void {
    this.getPins().forEach((e) => this.removePin(e));
  }

  /**
   * Returns all the entities registered with the model.
   */
  public getPins(): Pin[] {
    return Object.keys(this.entities).map((key) => this.entities[key]);
  }

  /**
   * Returns single entity by id if present in the model.
   */
  public getPinById(id: string): Pin | undefined {
    return this.entities[id];
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
  public removePin(entity: Pin): boolean {
    if (this.entities[entity.id] != null) {
      delete this.entities[entity.id];
      this.entitiesChanged.emit(this.getPins());
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
  public setPins(pins: Set<Pin>): boolean {
    this.clearPins();
    pins.forEach((e) => this.addPin(e, true));
    this.entitiesChanged.emit(this.getPins());

    return true;
  }

  /**
   * Sets the set of entities to be placed with the model.
   *
   * @param pin A pin to set
   * @returns `true` if the entity has been set
   */
  public setPin(pin: Pin): boolean {
    this.entities = {
      ...this.entities,
      [pin.id]: pin,
    };
    this.entitiesChanged.emit(this.getPins());

    return true;
  }

  /**
   * Sets the set of entities to be placed with the model.
   *
   * @param pin A pin to set
   * @returns `true` if the entity has been set
   */
  public updatePin(pin: Pin): boolean {
    const pinById = this.getPinById(pin.id);
    if (pinById != null) {
      this.entities = {
        ...this.entities,
        [pin.id]: pin,
      };
      this.entitiesChanged.emit(this.getPins());

      return true;
    }
    return false;
  }

  /**
   * Registers an event listener that will be invoked when the model's
   * pin entities change.
   *
   * @param listener The listener to add.
   * @returns A disposable that can be used to remove the listener.
   */
  public onEntitiesChanged(listener: Listener<Pin[]>): Disposable {
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
