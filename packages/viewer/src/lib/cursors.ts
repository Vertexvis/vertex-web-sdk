import { Disposable, EventDispatcher } from '@vertexvis/utils';

/**
 * Represents a built-in [browser CSS
 * cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor).
 */
export type CssCursor =
  | 'auto'
  | 'default'
  | 'none'
  | 'context-menu'
  | 'help'
  | 'pointer'
  | 'progress'
  | 'wait'
  | 'cell'
  | 'crosshair'
  | 'text'
  | 'vertical-text'
  | 'alias'
  | 'copy'
  | 'move'
  | 'no-drop'
  | 'not-allowed'
  | 'grab'
  | 'grabbing'
  | 'all-scroll'
  | 'col-resize'
  | 'row-resize'
  | 'n-resize'
  | 'e-resize'
  | 's-resize'
  | 'w-resize'
  | 'ne-resize'
  | 'nw-resize'
  | 'se-resize'
  | 'sw-resize'
  | 'ew-resize'
  | 'ns-resize'
  | 'nesw-resize'
  | 'nwse-resize'
  | 'zoom-in'
  | 'zoom-out'
  | string;

/**
 * Represents a custom cursor that points to an image file and offset.
 */
export interface CustomCursor {
  url: string;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Represents all possible cursor types.
 */
export type Cursor = CssCursor | CustomCursor;

interface CursorInstance extends Disposable {
  id: number;
  cursor: Cursor;
  priority: number;
}

/**
 * The cursor manager maintains a prioritized list of cursors for the viewer.
 *
 * Cursors with the highest priority will be considered active, where the most
 * recently added cursor will take precedence if there are multiple cursors with
 * the same priority.
 */
export class CursorManager {
  /**
   * A constant representing the lowest priority cursors.
   */
  public static readonly LOW_PRIORITY = 0;

  /**
   * A constant representing a priority between `LOW_PRIORITY` and
   * `HIGH_PRIORITY`.
   */
  public static readonly NORMAL_PRIORITY = 10;

  /**
   * A constant representing the high priority cursors.
   */
  public static readonly HIGH_PRIORITY = 20;

  /**
   * An event dispatcher that emits an event when a cursor is added or removed.
   *
   * @see {@link CursorManager.add} to add a cursor.
   * @see {@link CursorManager.getActiveCursor} to query the current cursor.
   */
  public readonly onChanged = new EventDispatcher<void>();

  private cursors: CursorInstance[] = [];

  private nextId = 0;

  /**
   * Adds a cursor to the cursor manager, and returns an identifier that can be
   * used to remove the cursor.
   *
   * @param cursor The cursor to add.
   * @param priority The priority of the cursor. Higher values have higher
   * 	priority over lower values.
   * @returns An identifier for the cursor.
   * @see {@link CursorManager.getActiveCursor} to query the current cursor.
   */
  public add(
    cursor: Cursor,
    priority = CursorManager.NORMAL_PRIORITY
  ): Disposable {
    const id = ++this.nextId;
    const instance = { id, cursor, priority, dispose: () => this.remove(id) };
    this.cursors.push(instance);
    this.onChanged.emit();
    return instance;
  }

  /**
   * Removes a cursor with the given ID, if it exists.
   *
   * @param cursorId The ID of the cursor to remove.
   */
  private remove(cursorId: number): void {
    const index = this.cursors.findIndex(({ id }) => id === cursorId);
    if (index >= 0) {
      this.cursors.splice(index, 1);
      this.onChanged.emit();
    }
  }

  /**
   * Returns the active cursor based on priority and insertion order.
   *
   * @see {@link CursorManager.add} to add a cursor.
   */
  public getActiveCursor(): Cursor | undefined {
    const sorted = this.cursors
      .concat()
      .reverse()
      .sort((a, b) => b.priority - a.priority);

    return sorted[0]?.cursor;
  }
}
