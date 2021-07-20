import { CursorManager } from '../cursors';

describe(CursorManager, () => {
  it('can add a cursor', () => {
    const cursors = new CursorManager();
    cursors.add('crosshair');
    expect(cursors.getActiveCursor()).toBeDefined();
  });

  it('can remove a cursor', () => {
    const cursors = new CursorManager();
    const cursor = cursors.add('crosshair');
    cursor.dispose();
    expect(cursors.getActiveCursor()).toBeUndefined();
  });

  it('picks cursor with highest priority', () => {
    const cursors = new CursorManager();
    cursors.add('crosshair', CursorManager.HIGH_PRIORITY);
    cursors.add('pointer', CursorManager.LOW_PRIORITY);
    expect(cursors.getActiveCursor()).toBe('crosshair');
  });

  it('picks most recent cursor with same priority', () => {
    const cursors = new CursorManager();
    cursors.add('crosshair', CursorManager.NORMAL_PRIORITY);
    cursors.add('pointer', CursorManager.NORMAL_PRIORITY);
    expect(cursors.getActiveCursor()).toBe('pointer');
  });
});
