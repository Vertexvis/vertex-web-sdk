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
    // Ensure a duplicate cursor will not be added to the cursor manager.
    // If a matching cursor exists, delete it before proceeding.
    // Note that deleting the old cursor and adding the new one results in the
    // new cursor taking precedent over other existing cursors with the same priority.
    const duplicateCursor = this.getExistingDuplicateCursor(cursor, priority);
    if (duplicateCursor != null) {
      this.remove(duplicateCursor.id);
    }

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
   * Checks to see if an existing cursor matches the provided cursor and priority level.
   * The matching cursor is returned if found.
   *
   * @param cursorToCheck The cursor to check for duplicates against.
   * @param priorityToCheck The priority level to check for duplicates against.
   */
  private getExistingDuplicateCursor(
    cursorToCheck: Cursor,
    priorityToCheck: number
  ): CursorInstance | undefined {
    return this.cursors.find(
      (cursor) =>
        cursor.cursor === cursorToCheck && cursor.priority === priorityToCheck
    );
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

// CSS SVG images need to be URL encoded: https://yoksel.github.io/url-encoder/

export const measurementCursor = {
  url: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M21.5 8h-19a.5.5 0 00-.5.5v6a.5.5 0 00.5.5h19a.5.5 0 00.5-.5v-6a.5.5 0 00-.5-.5zm-.5 6H3V9h3v2.5a.5.5 0 001 0V9h2v2.5a.5.5 0 001 0V9h2v2.5a.5.5 0 001 0V9h2v2.5a.5.5 0 001 0V9h2v2.5a.5.5 0 001 0V9h2z' stroke='%23fff' stroke-width='1.25' stroke-opacity='0.5' stroke-miterlimit='10' shape-rendering='crispEdges'/%3E%3Cpath d='M21.5 8h-19a.5.5 0 00-.5.5v6a.5.5 0 00.5.5h19a.5.5 0 00.5-.5v-6a.5.5 0 00-.5-.5zm-.5 6H3V9h3v2.5a.5.5 0 001 0V9h2v2.5a.5.5 0 001 0V9h2v2.5a.5.5 0 001 0V9h2v2.5a.5.5 0 001 0V9h2v2.5a.5.5 0 001 0V9h2z' shape-rendering='crispEdges'/%3E%3C/svg%3E",
  offsetX: -24,
  offsetY: -24,
};

export const measurementWithArrowCursor = {
  url: "data:image/svg+xml;utf8,%3Csvg id='icons' xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bstroke:%23fff;stroke-miterlimit:10;stroke-width:2px;%7D.cls-2%7Bfill:%23fff;%7D.cls-2,.cls-3%7Bfill-rule:evenodd;%7D%3C/style%3E%3C/defs%3E%3Cpath class='cls-1' d='M27.46,21h-19a.5.5,0,0,0-.5.5v6a.5.5,0,0,0,.5.5h19a.5.5,0,0,0,.5-.5v-6A.5.5,0,0,0,27.46,21ZM27,27H9V22h3v2.5a.5.5,0,0,0,1,0V22h2v2.5a.5.5,0,0,0,1,0V22h2v2.5a.5.5,0,0,0,1,0V22h2v2.5a.5.5,0,0,0,1,0V22h2v2.5a.5.5,0,0,0,1,0V22h2Z'/%3E%3Cpath d='M27.46,21h-19a.5.5,0,0,0-.5.5v6a.5.5,0,0,0,.5.5h19a.5.5,0,0,0,.5-.5v-6A.5.5,0,0,0,27.46,21ZM27,27H9V22h3v2.5a.5.5,0,0,0,1,0V22h2v2.5a.5.5,0,0,0,1,0V22h2v2.5a.5.5,0,0,0,1,0V22h2v2.5a.5.5,0,0,0,1,0V22h2v2.5a.5.5,0,0,0,1,0V22h2Z'/%3E%3Cpath class='cls-2' d='M1,17V1L12.59,12.62H5.81l-.41.12Z'/%3E%3Cpath class='cls-2' d='M10.08,17.69l-3.6,1.53L1.8,8.14,5.48,6.58Z'/%3E%3Cpath class='cls-3' d='M8.75,17l-1.84.77-3.1-7.37,1.84-.78Z'/%3E%3Cpath class='cls-3' d='M2,3.41V14.6l3-2.87.43-.14h4.76Z'/%3E%3C/svg%3E",
  offsetX: -30,
  offsetY: -30,
};

export const pinCursor = {
  url: "data:image/svg+xml,%3Csvg width='36px' height='36px' viewBox='0 0 24 24' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cdefs%3E%3Cpath d='M12,2 C7.581722,2 4,5.581722 4,10 C4.00435812,11.7714969 4.41127263,13.5188357 5.19,15.11 C6.15517666,17.0237439 7.49502409,18.7240579 9.13,20.11 C9.86916736,20.7592093 10.6620019,21.3446357 11.5,21.86 L12,22.14 L12.5,21.86 C13.8750156,21.0120029 15.1296156,19.9827599 16.23,18.8 C17.2698142,17.7023203 18.1394508,16.4551671 18.81,15.1 C19.5872532,13.5118707 19.9941287,11.7681184 20,10 C20,5.581722 16.418278,2 12,2 Z M12,13 C10.3431458,13 9,11.6568542 9,10 C9,8.34314575 10.3431458,7 12,7 C13.6568542,7 15,8.34314575 15,10 C15,10.7956495 14.6839295,11.5587112 14.1213203,12.1213203 C13.5587112,12.6839295 12.7956495,13 12,13 Z' id='path-1'%3E%3C/path%3E%3C/defs%3E%3Cg id='icons/pin-filled' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cmask id='mask-2' fill='white'%3E%3Cuse xlink:href='%23path-1'%3E%3C/use%3E%3C/mask%3E%3Cuse id='Shape' stroke='%23FAFAFA' fill='%23BDBDBD' fill-rule='nonzero' xlink:href='%23path-1'%3E%3C/use%3E%3C/g%3E%3C/svg%3E",
  offsetX: 17,
  offsetY: 22,
};

export const labelPinCursor = {
  url: "data:image/svg+xml,%3Csvg width='36px' height='36px' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 16 24' %3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:none;%7D.cls-2%7Bfill:%23616161;%7D.cls-3%7Bclip-path:url(%23clip-path);%7D%3C/style%3E%3CclipPath id='clip-path'%3E%3Ccircle cx='-576.76' cy='-107.26' r='4'/%3E%3C/clipPath%3E%3C/defs%3E%3Cpath  d='M8,16H8a.48.48,0,0,1-.42-.23L5.75,13H3.51A1.5,1.5,0,0,1,2,11.5v-8A1.5,1.5,0,0,1,3.51,2h9A1.51,1.51,0,0,1,14,3.5v8a1.5,1.5,0,0,1-1.5,1.5H10.22L8.39,15.81A.5.5,0,0,1,8,16ZM3.51,3a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5H6a.5.5,0,0,1,.42.23L8,14.61l1.55-2.38A.5.5,0,0,1,10,12h2.56a.5.5,0,0,0,.5-.5v-8a.51.51,0,0,0-.5-.5Z'/%3E%3Ccircle cx='8.01' cy='20' r='2'/%3E%3C/svg%3E%0A",
  offsetX: 17,
  offsetY: 29,
};

export const boxQueryCursor = {
  url: "data:image/svg+xml;utf8,%3Csvg id='icons' xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bstroke:%23fff;stroke-miterlimit:10;stroke-width:2px;%7D.cls-2%7Bfill:%23fff;%7D.cls-2,.cls-3%7Bfill-rule:evenodd;%7D%3C/style%3E%3C/defs%3E%3Cpath class='cls-2' d='M1.25,17V1L12.59,12.62H5.81l-.41.12Z'/%3E%3Cpath class='cls-2' d='M10.33,17.69l-3.6,1.53L1.8,8.14,5.48,6.58Z'/%3E  %3Cpath class='cls-3' d='M9,17l-1.84.77-3.1-7.37,1.84-.78Z'/%3E%3Cpath class='cls-3' d='M2.25,3.41V14.6l3-2.87.43-.14h4.76Z'/%3E%3Cpath class='cls-1' d='M21.36,22.5H15.5V16.64a.5.5,0,0,0-1,0V22.5H8.64a.5.5,0,0,0,0,1H14.5v5.86a.5.5,0,0,0,1,0V23.5h5.86a.5.5,0,0,0,0-1Z' /%3E  %3Cpath d='M21.36,22.5H15.5V16.64a.5.5,0,0,0-1,0V22.5H8.64a.5.5,0,0,0,0,1H14.5v5.86a.5.5,0,0,0,1,0V23.5h5.86a.5.5,0,0,0,0-1Z' /%3E%3C/svg%3E",
  offsetX: -30,
  offsetY: -30,
};
