import { Vector3 } from '@vertexvis/geometry';
import { ItemSelectorBuilder, Selector, SelectorBuilder } from './selectors';
import { Camera } from '@vertexvis/graphics3d';

interface ClearAllHighlightOperation {
  type: 'clear_highlight_all';
}

interface ShowItemOperation {
  type: 'show';
}

interface ShowAllOperation {
  type: 'show_all';
}

interface HideAllOperation {
  type: 'hide_all';
}

interface HideItemOperation {
  type: 'hide';
}

interface ShowOnlyItemOperation {
  type: 'show_only';
}

interface HighlightItemOperation {
  type: 'highlight';
  color: string;
}

/**
 * Defines the set of operations that happen at the scene level.
 */
export type SceneOperation =
  | ClearAllHighlightOperation
  | ShowAllOperation
  | HideAllOperation;

/**
 * Defines the set of operations that happen at the scene item level.
 */
export type ItemOperation =
  | ShowItemOperation
  | HideItemOperation
  | ShowOnlyItemOperation
  | HighlightItemOperation;

export interface OperationDefinition {
  operation: SceneOperation | ItemOperation;
  selector?: Selector;
}

/**
 * Defines a function that is responsible for configuring a `Selector`. It is
 * passed a builder that contains methods to select items that should be
 * operated on.
 */
export type SelectorFactory = (
  builder: Omit<SelectorBuilder<Selector>, 'build'>
) => Omit<SelectorBuilder<Selector>, 'build'>;

/**
 * The `SceneItemOperations` interface defines a set of methods that mutate the
 * items belonging to a scene. This interface should not contain methods that
 * operate at the scene level.
 */
export interface SceneItemOperations<T> {
  /**
   * Clears any highlighting that has been applied to an item.
   */
  clearAllHighlights(): T;

  /**
   * Updates the scene to hide any items that match the given selector.
   *
   * @param selector A function that generates a selector.
   */
  hide(selector: SelectorFactory): T;

  /**
   * Updates the scene to highlight any items that match the given selector.
   *
   * @param color An RGB hex highlight color.
   * @param selector A function that generates a selector.
   */
  highlight(color: string, selector: SelectorFactory): T;

  /**
   * Updates the scene to show any items that match the given selector.
   *
   * @param selector A function that generates a selector.
   */
  show(selector: SelectorFactory): T;

  /**
   * Updates the scene to hide any items that do not match the given selector.
   *
   * @param selector A function that generates a selector.
   */
  showOnly(selector: SelectorFactory): T;
}

/**
 * The `SceneCameraOperations` interface defines methods for modifying the
 * camera of a scene.
 */
export interface SceneCameraOperations<T> {
  /**
   * Sets the position of the camera within the scene.
   *
   * @param position A vector describing the new position of the camera.
   */
  position(position: Vector3.Vector3): T;

  /**
   * Updates the camera's rotation to look at the given position.
   *
   * @param lookAt A vector describing the position to look at.
   */
  lookAt(lookAt: Vector3.Vector3): T;

  /**
   * Updates the camera's up vector.
   *
   * @param up A normalized vector.
   */
  up(up: Vector3.Vector3): T;

  /**
   * Updates the given fields of the camera, including position, up and look at
   * points. All fields are optional.
   *
   * @param data Camera data to set.
   */
  set(
    data: Partial<Pick<Camera.Camera, 'position' | 'upvector' | 'lookat'>>
  ): T;

  /**
   * Repositions the camera so all non-hidden items in the scene are visible.
   */
  viewAll(): T;
}

/**
 * The `SceneOperationBuilder` provides a fluent builder interface for
 * constructing operations to modify a scene.
 */
export class SceneOperationBuilder
  implements SceneItemOperations<SceneOperationBuilder> {
  private operations: OperationDefinition[] = [];

  /**
   * Constructs the scene operations and returns a definition describing each
   * operation.
   */
  public build(): OperationDefinition[] {
    return this.operations.concat();
  }

  public clearAllHighlights(): SceneOperationBuilder {
    return this.operation({ type: 'clear_highlight_all' });
  }

  public show(selector: SelectorFactory): SceneOperationBuilder {
    return this.operation({ type: 'show' }, selector);
  }

  public showAll(): SceneOperationBuilder {
    return this.operation({ type: 'show_all' });
  }

  public hideAll(): SceneOperationBuilder {
    return this.operation({ type: 'hide_all' });
  }

  public hide(selector: SelectorFactory): SceneOperationBuilder {
    return this.operation({ type: 'hide' }, selector);
  }

  public highlight(
    color: string,
    selector: SelectorFactory
  ): SceneOperationBuilder {
    if (!color.startsWith('#')) {
      throw new Error(
        'Cannot highlight item. Malformed color value. Color should be formatted as #ffffff.'
      );
    }
    return this.operation({ type: 'highlight', color }, selector);
  }

  public showOnly(selector: SelectorFactory): SceneOperationBuilder {
    return this.operation({ type: 'show_only' }, selector);
  }

  private operation(operation: SceneOperation): SceneOperationBuilder;
  private operation(
    operation: ItemOperation,
    factory: SelectorFactory
  ): SceneOperationBuilder;

  private operation(...args: any[]): this {
    const operation = args[0];
    if (args.length === 1) {
      this.operations.push({ operation });
    } else if (args.length === 2) {
      const factory = args[1];
      const selector = factory(new ItemSelectorBuilder()).build();
      this.operations.push({ operation, selector });
    }
    return this;
  }
}
